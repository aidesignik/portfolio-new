import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { offerSchema } from "@/lib/validation/offer.schema";
import { suggestPrice } from "@/lib/pricing";
import { checkAvailability } from "@/lib/availability";
import { estimateRouteDistance } from "@/lib/tripDistance";

const AVERAGE_TRIP_DURATION_HOURS = 4;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id: requestId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  if (carrier.status !== "APPROVED") {
    return NextResponse.json({ error: "CARRIER_NOT_APPROVED" }, { status: 403 });
  }

  const bookingRequest = await prisma.bookingRequest.findUnique({
    where: { id: requestId },
    include: { stops: { orderBy: { order: "asc" } } },
  });
  if (!bookingRequest || bookingRequest.status === "CONFIRMED" || bookingRequest.status === "CANCELLED") {
    return NextResponse.json({ error: "REQUEST_NOT_AVAILABLE" }, { status: 409 });
  }

  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findFirst({ where: { id: data.vehicleId, carrierId: carrier.id } }),
    prisma.driver.findFirst({ where: { id: data.driverId, carrierId: carrier.id } }),
  ]);
  if (!vehicle || !driver) {
    return NextResponse.json({ error: "VEHICLE_OR_DRIVER_NOT_FOUND" }, { status: 404 });
  }

  const departureAt = bookingRequest.departureAt;
  const estimatedEnd =
    bookingRequest.returnAt ??
    new Date(departureAt.getTime() + AVERAGE_TRIP_DURATION_HOURS * 60 * 60 * 1000);

  const availability = await checkAvailability({
    vehicleId: vehicle.id,
    driverId: driver.id,
    start: departureAt,
    end: estimatedEnd,
  });
  if (!availability.available) {
    return NextResponse.json({ error: "UNAVAILABLE", conflicts: availability.conflicts }, { status: 409 });
  }

  // The carrier's own number wins if given; otherwise reuse the distance
  // already calculated when the client submitted this request, recomputing
  // it live only if that's missing (e.g. geocoding failed at the time).
  let distanceKm = data.distanceKm ?? bookingRequest.estimatedDistanceKm ?? undefined;
  if (!distanceKm) {
    const waypoints = [
      { city: bookingRequest.pickupCity, location: bookingRequest.pickupLocation },
      ...bookingRequest.stops,
      { city: bookingRequest.destinationCity, location: bookingRequest.destinationLocation },
    ];
    const estimate = await estimateRouteDistance(waypoints).catch(() => null);
    distanceKm = estimate?.distanceKm;
  }
  if (!distanceKm) {
    return NextResponse.json({ error: "DISTANCE_UNAVAILABLE" }, { status: 422 });
  }

  const suggestedPrice = suggestPrice(distanceKm, {
    ratePerKm: carrier.ratePerKm ? Number(carrier.ratePerKm) : null,
    fixedFee: carrier.fixedFee ? Number(carrier.fixedFee) : null,
  });

  const offer = await prisma.$transaction(async (tx) => {
    const created = await tx.offer.create({
      data: {
        requestId,
        carrierId: carrier.id,
        vehicleId: vehicle.id,
        driverId: driver.id,
        distanceKm,
        suggestedPrice,
        finalPrice: data.finalPrice,
        notes: data.notes,
      },
    });
    await tx.bookingRequest.update({ where: { id: requestId }, data: { status: "OFFERED" } });
    return created;
  });

  return NextResponse.json({ offer }, { status: 201 });
}
