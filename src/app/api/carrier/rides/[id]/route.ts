import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { createRideSchema } from "@/lib/validation/request.schema";
import { checkAvailability } from "@/lib/availability";
import { buildStopsCreate, returnLegScalars } from "@/lib/rideReturnLeg";

const AVERAGE_TRIP_DURATION_HOURS = 4;

// Editing a ride's own trip details (pickup/destination/stops, date/time,
// round trip, passenger count, special requests) — separate from
// vehicle/driver assignment (assign/route.ts) and status changes
// (cancel/complete). If a vehicle or driver is already assigned, a date/time
// change is re-checked against their schedule so an edit can't silently
// create a double-booking.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = createRideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const ride = await prisma.ride.findFirst({ where: { id, carrierId: carrier.id } });
  if (!ride) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (ride.status === "CANCELLED" || ride.status === "COMPLETED") {
    return NextResponse.json({ error: "RIDE_NOT_EDITABLE" }, { status: 409 });
  }

  if (ride.vehicleId || ride.driverId) {
    const estimatedEnd =
      data.returnAt ?? new Date(data.departureAt.getTime() + AVERAGE_TRIP_DURATION_HOURS * 60 * 60 * 1000);
    const availability = await checkAvailability({
      vehicleId: ride.vehicleId ?? undefined,
      driverId: ride.driverId ?? undefined,
      start: data.departureAt,
      end: estimatedEnd,
      excludeRideId: ride.id,
    });
    if (!availability.available) {
      return NextResponse.json({ error: "UNAVAILABLE", conflicts: availability.conflicts }, { status: 409 });
    }
  }

  const updated = await prisma.ride.update({
    where: { id },
    data: {
      pickupCity: data.pickupCity,
      pickupLocation: data.pickupLocation,
      destinationCity: data.destinationCity,
      destinationLocation: data.destinationLocation,
      departureAt: data.departureAt,
      isRoundTrip: data.isRoundTrip,
      returnAt: data.isRoundTrip ? data.returnAt : null,
      ...returnLegScalars(data),
      passengerCount: data.passengerCount,
      specialRequests: data.specialRequests,
      stops: {
        deleteMany: {},
        create: buildStopsCreate(data),
      },
    },
  });

  return NextResponse.json({ ride: updated });
}
