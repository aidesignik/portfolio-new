import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { carrierRideSchema } from "@/lib/validation/carrierRide.schema";
import { suggestPrice } from "@/lib/pricing";
import { checkAvailability, effectiveRideEnd } from "@/lib/availability";
import { estimateRouteDistance } from "@/lib/tripDistance";
import { returnLegScalars } from "@/lib/rideReturnLeg";

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

  const availability = await checkAvailability({
    vehicleId: vehicle.id,
    driverId: driver.id,
    start: data.departureAt,
    end: effectiveRideEnd(data.departureAt, data.returnAt ?? null),
  });
  // Advisory only — see assign/route.ts.
  if (!availability.available && !data.force) {
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

  // Suggested price computed for consistency with the rest of the app, even
  // though the carrier's own entered price is what's actually stored.
  suggestPrice(distanceKm, {
    ratePerKm: carrier.ratePerKm ? Number(carrier.ratePerKm) : null,
    fixedFee: carrier.fixedFee ? Number(carrier.fixedFee) : null,
  });

  const ride = await prisma.ride.create({
    data: {
      clientId,
      carrierId: carrier.id,
      vehicleId: vehicle.id,
      driverId: driver.id,
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
      ...returnLegScalars(data),
      passengerCount: data.passengerCount,
      specialRequests: data.specialRequests,
      estimatedDistanceKm: distanceKm,
      price: data.finalPrice,
      status: "CONFIRMED",
      stops: {
        create: [
          ...data.stops.map((stop, index) => ({
            ...stop,
            order: index,
            leg: "OUTBOUND" as const,
            lat: coordinates?.[index + 1]?.lat,
            lng: coordinates?.[index + 1]?.lng,
          })),
          // Return-leg stops aren't geocoded (out of scope for now) — only
          // stored when the carrier picked a custom return route.
          ...(data.isRoundTrip && data.returnStops.length > 0
            ? data.returnStops.map((stop, index) => ({ ...stop, order: index, leg: "RETURN" as const }))
            : []),
        ],
      },
    },
  });

  return NextResponse.json({ booking: ride }, { status: 201 });
}
