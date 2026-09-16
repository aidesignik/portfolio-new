import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { quickRideSchema } from "@/lib/validation/quickRide.schema";
import { checkAvailability } from "@/lib/availability";
import { buildStopsCreate, returnLegScalars } from "@/lib/rideReturnLeg";

const AVERAGE_TRIP_DURATION_HOURS = 4;

// The calendar's "+ New Ride" button — creates a ride already claimed by
// this carrier (so it shows in their own unassigned queue, not the
// marketplace-wide one). Vehicle/driver are optional: if the carrier
// already knows who's free and picks one on the form, it's assigned right
// away (subject to the same availability check as the calendar's drag-and-
// drop) and the ride is immediately CONFIRMED — there's no separate client
// waiting on a confirmation, the carrier creating it is the confirmation.
// Left unassigned, it lands PENDING and gets dispatched (and confirmed via
// the assign endpoint) later.
export async function POST(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = quickRideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  if (carrier.status !== "APPROVED") {
    return NextResponse.json({ error: "CARRIER_NOT_APPROVED" }, { status: 403 });
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

  if (data.vehicleId || data.driverId) {
    const estimatedEnd =
      data.returnAt ?? new Date(data.departureAt.getTime() + AVERAGE_TRIP_DURATION_HOURS * 60 * 60 * 1000);
    const availability = await checkAvailability({
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      start: data.departureAt,
      end: estimatedEnd,
    });
    if (!availability.available) {
      return NextResponse.json({ error: "UNAVAILABLE", conflicts: availability.conflicts }, { status: 409 });
    }
  }

  const ride = await prisma.ride.create({
    data: {
      clientId: client.id,
      carrierId: carrier.id,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      pickupCity: data.pickupCity,
      pickupLocation: data.pickupLocation,
      destinationCity: data.destinationCity,
      destinationLocation: data.destinationLocation,
      departureAt: data.departureAt,
      isRoundTrip: data.isRoundTrip,
      returnAt: data.returnAt,
      ...returnLegScalars(data),
      passengerCount: data.passengerCount,
      specialRequests: data.specialRequests,
      status: data.vehicleId && data.driverId ? "CONFIRMED" : "PENDING",
      stops: { create: buildStopsCreate(data) },
    },
  });

  return NextResponse.json({ ride }, { status: 201 });
}
