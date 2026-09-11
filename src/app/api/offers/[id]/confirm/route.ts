import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { checkAvailability } from "@/lib/availability";

const AVERAGE_TRIP_DURATION_HOURS = 4;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const { id: offerId } = await params;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { request: true },
  });
  if (!offer || offer.request.clientId !== session.user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (offer.status !== "PENDING") {
    return NextResponse.json({ error: "OFFER_NOT_PENDING" }, { status: 409 });
  }

  const departureAt = offer.request.departureAt;
  const estimatedEnd =
    offer.request.returnAt ??
    new Date(departureAt.getTime() + AVERAGE_TRIP_DURATION_HOURS * 60 * 60 * 1000);
  const availability = await checkAvailability({
    vehicleId: offer.vehicleId,
    driverId: offer.driverId,
    start: departureAt,
    end: estimatedEnd,
  });
  if (!availability.available) {
    return NextResponse.json({ error: "UNAVAILABLE", conflicts: availability.conflicts }, { status: 409 });
  }

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        requestId: offer.requestId,
        offerId: offer.id,
        clientId: offer.request.clientId,
        carrierId: offer.carrierId,
        vehicleId: offer.vehicleId,
        driverId: offer.driverId,
        price: offer.finalPrice,
        currency: offer.currency,
      },
    });

    await tx.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
    await tx.offer.updateMany({
      where: { requestId: offer.requestId, id: { not: offer.id }, status: "PENDING" },
      data: { status: "REJECTED" },
    });
    await tx.bookingRequest.update({ where: { id: offer.requestId }, data: { status: "CONFIRMED" } });

    return created;
  });

  return NextResponse.json({ booking }, { status: 201 });
}
