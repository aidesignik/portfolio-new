import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const bookings = await prisma.booking.findMany({
    where: { carrierId: carrier.id, status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
    include: {
      vehicle: true,
      driver: true,
      request: true,
    },
    orderBy: { request: { departureAt: "asc" } },
  });

  return NextResponse.json({ bookings });
}
