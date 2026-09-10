import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

// Single-carrier MVP: every pending/offered request is visible to the one
// active carrier. Multi-carrier routing/matching is deferred.
export async function GET() {
  const { error } = await requireApiRole("CARRIER");
  if (error) return error;

  const requests = await prisma.bookingRequest.findMany({
    where: { status: { in: ["PENDING", "OFFERED"] } },
    include: { client: { select: { name: true, phone: true, email: true } }, offers: true },
    orderBy: { departureAt: "asc" },
  });

  return NextResponse.json({ requests });
}
