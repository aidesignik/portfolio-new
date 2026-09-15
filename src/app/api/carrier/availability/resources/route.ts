import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

const AVERAGE_TRIP_DURATION_HOURS = 4;

// Which of this carrier's vehicles/drivers are actually free for a given
// trip window — used by the "+ New Ride" form to offer an "assign now"
// option filtered to real availability, same padding-window convention as
// checkAvailability() in lib/availability.ts.
export async function GET(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const departureAt = new Date(searchParams.get("departureAt") ?? "");
  if (Number.isNaN(departureAt.getTime())) {
    return NextResponse.json({ error: "INVALID_DEPARTURE_AT" }, { status: 400 });
  }
  const returnAtParam = searchParams.get("returnAt");
  const parsedReturnAt = returnAtParam ? new Date(returnAtParam) : null;
  const end =
    parsedReturnAt && !Number.isNaN(parsedReturnAt.getTime())
      ? parsedReturnAt
      : new Date(departureAt.getTime() + AVERAGE_TRIP_DURATION_HOURS * 60 * 60 * 1000);

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });

  const windowStart = new Date(departureAt.getTime() - 3 * 60 * 60 * 1000);
  const windowEnd = new Date(end.getTime() + 3 * 60 * 60 * 1000);

  const [vehicles, drivers, overlappingRides, overlappingBlocks] = await Promise.all([
    prisma.vehicle.findMany({
      where: { carrierId: carrier.id, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.driver.findMany({
      where: { carrierId: carrier.id, isAvailable: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.ride.findMany({
      where: {
        carrierId: carrier.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        departureAt: { gte: windowStart, lte: windowEnd },
      },
      select: { vehicleId: true, driverId: true },
    }),
    prisma.block.findMany({
      where: { carrierId: carrier.id, startAt: { lte: windowEnd }, endAt: { gte: windowStart } },
      select: { vehicleId: true, driverId: true },
    }),
  ]);

  const busyVehicleIds = new Set(
    [...overlappingRides, ...overlappingBlocks].map((r) => r.vehicleId).filter((id): id is string => Boolean(id)),
  );
  const busyDriverIds = new Set(
    [...overlappingRides, ...overlappingBlocks].map((r) => r.driverId).filter((id): id is string => Boolean(id)),
  );

  return NextResponse.json({
    vehicles: vehicles.filter((v) => !busyVehicleIds.has(v.id)),
    drivers: drivers.filter((d) => !busyDriverIds.has(d.id)),
  });
}
