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

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, email: true, phone: true } },
      carrier: true,
      vehicle: true,
      driver: true,
      request: true,
      offer: true,
      documents: true,
    },
  });
  if (!booking) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const isClient = session.user.role === "CLIENT" && booking.clientId === session.user.id;
  const isCarrier = session.user.role === "CARRIER" && booking.carrierId === session.user.carrierId;
  const isAdmin = session.user.role === "ADMIN";
  if (!isClient && !isCarrier && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ booking });
}
