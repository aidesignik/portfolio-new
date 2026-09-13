import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const bookings = await prisma.ride.findMany({
    where: { carrierId: carrier.id, status: "CONFIRMED" },
    include: { vehicle: true, driver: true },
    orderBy: { departureAt: "asc" },
  });

  return NextResponse.json({ bookings });
}
