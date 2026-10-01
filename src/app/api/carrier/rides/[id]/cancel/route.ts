import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { displayRideStatus } from "@/lib/rideStatus";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const ride = await prisma.ride.findFirst({ where: { id, carrierId: carrier.id } });
  if (!ride) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  // Blocks an explicit COMPLETED status and a ride whose trip window has
  // simply passed (see displayRideStatus) — matches what the UI now shows
  // as cancellable, not just the raw stored status.
  const status = displayRideStatus({
    status: ride.status,
    departureAt: ride.departureAt.toISOString(),
    returnAt: ride.returnAt?.toISOString() ?? null,
  });
  if (status === "COMPLETED" || status === "CANCELLED") {
    return NextResponse.json({ error: "RIDE_ALREADY_COMPLETED" }, { status: 409 });
  }

  const updated = await prisma.ride.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ ride: updated });
}
