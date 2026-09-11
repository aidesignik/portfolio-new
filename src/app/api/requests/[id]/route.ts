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

  const bookingRequest = await prisma.bookingRequest.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, phone: true, email: true } },
      stops: { orderBy: { order: "asc" } },
      offers: { include: { carrier: true, vehicle: true, driver: true } },
      booking: true,
    },
  });

  if (!bookingRequest) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isOwner = session.user.role === "CLIENT" && bookingRequest.clientId === session.user.id;
  const isCarrier = session.user.role === "CARRIER";
  if (!isOwner && !isCarrier) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ request: bookingRequest });
}
