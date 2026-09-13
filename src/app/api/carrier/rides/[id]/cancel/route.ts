import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const ride = await prisma.ride.findFirst({ where: { id, carrierId: carrier.id } });
  if (!ride) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (ride.status === "COMPLETED") {
    return NextResponse.json({ error: "RIDE_ALREADY_COMPLETED" }, { status: 409 });
  }

  const updated = await prisma.ride.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ ride: updated });
}
