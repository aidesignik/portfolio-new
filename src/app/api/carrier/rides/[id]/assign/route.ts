import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { rideAssignmentSchema } from "@/lib/validation/rideAssignment.schema";
import { suggestPrice } from "@/lib/pricing";
import { checkAvailability } from "@/lib/availability";
import { estimateRouteDistance } from "@/lib/tripDistance";

const AVERAGE_TRIP_DURATION_HOURS = 4;

// Assigns (or reassigns) a vehicle and/or driver to a ride — either one
// alone is fine, since the calendar's drag-and-drop assigns one resource at
// a time. The first carrier to touch an unclaimed ride claims it. There's
// no separate priced-offer/accept step; this is a direct edit.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id: rideId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = rideAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  if (carrier.status !== "APPROVED") {
    return NextResponse.json({ error: "CARRIER_NOT_APPROVED" }, { status: 403 });
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId }, include: { stops: true } });
  if (!ride) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (ride.carrierId && ride.carrierId !== carrier.id) {
    return NextResponse.json({ error: "ALREADY_CLAIMED" }, { status: 409 });
  }
  if (ride.status === "CANCELLED" || ride.status === "COMPLETED") {
    return NextResponse.json({ error: "RIDE_NOT_AVAILABLE" }, { status: 409 });
  }

  const [vehicle, driver] = await Promise.all([
    data.vehicleId
      ? prisma.vehicle.findFirst({ where: { id: data.vehicleId, carrierId: carrier.id } })
      : null,
    data.driverId ? prisma.driver.findFirst({ where: { id: data.driverId, carrierId: carrier.id } }) : null,
  ]);
  if (data.vehicleId && !vehicle) {
    return NextResponse.json({ error: "VEHICLE_OR_DRIVER_NOT_FOUND" }, { status: 404 });
  }
  if (data.driverId && !driver) {
    return NextResponse.json({ error: "VEHICLE_OR_DRIVER_NOT_FOUND" }, { status: 404 });
  }

  const estimatedEnd =
    ride.returnAt ?? new Date(ride.departureAt.getTime() + AVERAGE_TRIP_DURATION_HOURS * 60 * 60 * 1000);
  const availability = await checkAvailability({
    vehicleId: data.vehicleId,
    driverId: data.driverId,
    start: ride.departureAt,
    end: estimatedEnd,
    excludeRideId: ride.id,
  });
  if (!availability.available) {
    return NextResponse.json({ error: "UNAVAILABLE", conflicts: availability.conflicts }, { status: 409 });
  }

  let distanceKm = data.distanceKm ?? ride.estimatedDistanceKm ?? undefined;
  if (!distanceKm) {
    const waypoints = [
      { city: ride.pickupCity, location: ride.pickupLocation },
      ...ride.stops,
      { city: ride.destinationCity, location: ride.destinationLocation },
    ];
    const estimate = await estimateRouteDistance(waypoints).catch(() => null);
    distanceKm = estimate?.distanceKm;
  }

  const price =
    data.price ??
    (distanceKm
      ? suggestPrice(distanceKm, {
          ratePerKm: carrier.ratePerKm ? Number(carrier.ratePerKm) : null,
          fixedFee: carrier.fixedFee ? Number(carrier.fixedFee) : null,
        })
      : ride.price
        ? Number(ride.price)
        : undefined);

  const updated = await prisma.ride.update({
    where: { id: ride.id },
    data: {
      carrierId: carrier.id,
      vehicleId: data.vehicleId ?? undefined,
      driverId: data.driverId ?? undefined,
      estimatedDistanceKm: distanceKm ?? ride.estimatedDistanceKm,
      price,
    },
  });

  return NextResponse.json({ ride: updated });
}
