import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { quickRideSchema } from "@/lib/validation/quickRide.schema";

// The calendar's "+ New Ride" button — creates a ride already claimed by
// this carrier (so it shows in their own unassigned queue, not the
// marketplace-wide one) but with no vehicle/driver/price yet. Assignment
// happens afterward from the calendar.
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

  const ride = await prisma.ride.create({
    data: {
      clientId: client.id,
      carrierId: carrier.id,
      pickupCity: data.pickupCity,
      pickupLocation: data.pickupLocation,
      destinationCity: data.destinationCity,
      destinationLocation: data.destinationLocation,
      departureAt: data.departureAt,
      isRoundTrip: data.isRoundTrip,
      returnAt: data.returnAt,
      passengerCount: data.passengerCount,
      specialRequests: data.specialRequests,
      status: "PENDING",
      stops: { create: data.stops.map((stop, index) => ({ ...stop, order: index })) },
    },
  });

  return NextResponse.json({ ride }, { status: 201 });
}
