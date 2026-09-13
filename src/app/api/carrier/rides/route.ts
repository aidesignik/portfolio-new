import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { carrierRideSchema } from "@/lib/validation/carrierRide.schema";
import { suggestPrice } from "@/lib/pricing";
import { checkAvailability } from "@/lib/availability";
import { estimateRouteDistance } from "@/lib/tripDistance";

const AVERAGE_TRIP_DURATION_HOURS = 4;

export async function POST(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = carrierRideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  if (carrier.status !== "APPROVED") {
    return NextResponse.json({ error: "CARRIER_NOT_APPROVED" }, { status: 403 });
  }

  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findFirst({ where: { id: data.vehicleId, carrierId: carrier.id } }),
    prisma.driver.findFirst({ where: { id: data.driverId, carrierId: carrier.id } }),
  ]);
  if (!vehicle || !driver) {
    return NextResponse.json({ error: "VEHICLE_OR_DRIVER_NOT_FOUND" }, { status: 404 });
  }

  const estimatedEnd =
    data.returnAt ?? new Date(data.departureAt.getTime() + AVERAGE_TRIP_DURATION_HOURS * 60 * 60 * 1000);
  const availability = await checkAvailability({
    vehicleId: vehicle.id,
    driverId: driver.id,
    start: data.departureAt,
    end: estimatedEnd,
  });
  if (!availability.available) {
    return NextResponse.json({ error: "UNAVAILABLE", conflicts: availability.conflicts }, { status: 409 });
  }

  const email = data.clientEmail.toLowerCase();
  let client = await prisma.user.findUnique({ where: { email } });
  if (client && client.role !== "CLIENT") {
    return NextResponse.json({ error: "EMAIL_BELONGS_TO_OTHER_ROLE" }, { status: 409 });
  }
  if (!client) {
    client = await prisma.user.create({
      data: { email, name: data.clientName, phone: data.clientPhone, role: "CLIENT" },
    });
  }
  const clientId = client.id;

  // Same distance calculation the client-facing request flow uses (geocode
  // pickup/stops/destination, then route) — a manually entered distanceKm
  // only serves as an override/fallback when that can't resolve an address.
  const waypoints = [
    { city: data.pickupCity, location: data.pickupLocation },
    ...data.stops,
    { city: data.destinationCity, location: data.destinationLocation },
  ];
  const estimate = data.distanceKm ? null : await estimateRouteDistance(waypoints).catch(() => null);
  const distanceKm = data.distanceKm ?? estimate?.distanceKm;
  if (!distanceKm) {
    return NextResponse.json({ error: "DISTANCE_UNAVAILABLE" }, { status: 422 });
  }
  const coordinates = estimate?.coordinates ?? null;
  const destinationCoords = coordinates?.[coordinates.length - 1];

  const suggestedPrice = suggestPrice(distanceKm, {
    ratePerKm: carrier.ratePerKm ? Number(carrier.ratePerKm) : null,
    fixedFee: carrier.fixedFee ? Number(carrier.fixedFee) : null,
  });

  const booking = await prisma.$transaction(async (tx) => {
    const bookingRequest = await tx.bookingRequest.create({
      data: {
        clientId,
        pickupCity: data.pickupCity,
        pickupLocation: data.pickupLocation,
        pickupLat: coordinates?.[0]?.lat,
        pickupLng: coordinates?.[0]?.lng,
        destinationCity: data.destinationCity,
        destinationLocation: data.destinationLocation,
        destinationLat: destinationCoords?.lat,
        destinationLng: destinationCoords?.lng,
        departureAt: data.departureAt,
        isRoundTrip: data.isRoundTrip,
        returnAt: data.returnAt,
        passengerCount: data.passengerCount,
        specialRequests: data.specialRequests,
        estimatedDistanceKm: distanceKm,
        status: "CONFIRMED",
        stops: {
          create: data.stops.map((stop, index) => ({
            ...stop,
            order: index,
            lat: coordinates?.[index + 1]?.lat,
            lng: coordinates?.[index + 1]?.lng,
          })),
        },
      },
    });

    const offer = await tx.offer.create({
      data: {
        requestId: bookingRequest.id,
        carrierId: carrier.id,
        vehicleId: vehicle.id,
        driverId: driver.id,
        distanceKm,
        suggestedPrice,
        finalPrice: data.finalPrice,
        status: "ACCEPTED",
      },
    });

    return tx.booking.create({
      data: {
        requestId: bookingRequest.id,
        offerId: offer.id,
        clientId,
        carrierId: carrier.id,
        vehicleId: vehicle.id,
        driverId: driver.id,
        price: data.finalPrice,
      },
    });
  });

  return NextResponse.json({ booking }, { status: 201 });
}
