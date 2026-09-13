import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

// Any approved carrier can see every unclaimed ride — first to assign a
// vehicle/driver claims it (see /api/carrier/rides/[id]/assign).
export async function GET() {
  const { error } = await requireApiRole("CARRIER");
  if (error) return error;

  const requests = await prisma.ride.findMany({
    where: { carrierId: null, status: "PENDING" },
    include: { client: { select: { name: true, phone: true, email: true } } },
    orderBy: { departureAt: "asc" },
  });

  return NextResponse.json({ requests });
}
