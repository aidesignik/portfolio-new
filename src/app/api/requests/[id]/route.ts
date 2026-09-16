import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;

  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, phone: true, email: true } },
      stops: { where: { leg: "OUTBOUND" }, orderBy: { order: "asc" } },
      carrier: true,
      vehicle: true,
      driver: true,
    },
  });

  if (!ride) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isOwner = session.user.role === "CLIENT" && ride.clientId === session.user.id;
  const isCarrier = session.user.role === "CARRIER";
  if (!isOwner && !isCarrier) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ request: ride });
}
