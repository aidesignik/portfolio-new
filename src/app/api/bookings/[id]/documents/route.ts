import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { generateDocument } from "@/lib/documents/generate";
import type { DocumentType } from "@prisma/client";

const VALID_TYPES: DocumentType[] = ["CONTRACT", "CONFIRMATION", "INVOICE"];

async function authorizeForBooking(bookingId: string) {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) };

  const isClient = session.user.role === "CLIENT" && booking.clientId === session.user.id;
  const isCarrier = session.user.role === "CARRIER" && booking.carrierId === session.user.carrierId;
  const isAdmin = session.user.role === "ADMIN";
  if (!isClient && !isCarrier && !isAdmin) {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }

  return { booking };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { error } = await authorizeForBooking(id);
  if (error) return error;

  const documents = await prisma.document.findMany({ where: { bookingId: id } });
  return NextResponse.json({ documents });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { error } = await authorizeForBooking(id);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const type = body?.type as DocumentType | undefined;
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  }

  const document = await generateDocument(id, type);
  return NextResponse.json({ document });
}
