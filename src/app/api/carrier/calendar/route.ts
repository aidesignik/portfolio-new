import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

// Returns everything the resource-timeline calendar needs for one week:
// the carrier's vehicles/drivers (rows), rides and blocks overlapping that
// week (blocks), and the always-visible unassigned-ride queue (not scoped
// to the visible week — a carrier should see every ride waiting on them).
export async function GET(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("weekStart");
  const weekStart = weekStartParam ? new Date(weekStartParam) : new Date();
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });

  const [vehicles, drivers, rides, blocks, unassigned] = await Promise.all([
    prisma.vehicle.findMany({ where: { carrierId: carrier.id }, orderBy: { createdAt: "asc" } }),
    prisma.driver.findMany({ where: { carrierId: carrier.id }, orderBy: { createdAt: "asc" } }),
    prisma.ride.findMany({
      where: {
        carrierId: carrier.id,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        OR: [{ vehicleId: { not: null } }, { driverId: { not: null } }],
        departureAt: { lt: weekEnd },
        AND: [{ OR: [{ returnAt: null }, { returnAt: { gte: weekStart } }] }],
      },
      include: { client: { select: { name: true, phone: true } } },
    }),
    prisma.block.findMany({
      where: { carrierId: carrier.id, startAt: { lt: weekEnd }, endAt: { gte: weekStart } },
    }),
    // Truly untouched rides only (no vehicle AND no driver yet) — either
    // marketplace-wide (nobody's claimed it) or this carrier's own
    // quick-created rides still waiting on an assignment.
    prisma.ride.findMany({
      where: {
        status: "PENDING",
        vehicleId: null,
        driverId: null,
        OR: [{ carrierId: null }, { carrierId: carrier.id }],
      },
      include: { client: { select: { name: true, phone: true } } },
      orderBy: { departureAt: "asc" },
    }),
  ]);

  return NextResponse.json({
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    vehicles,
    drivers,
    rides,
    blocks,
    unassigned,
  });
}
