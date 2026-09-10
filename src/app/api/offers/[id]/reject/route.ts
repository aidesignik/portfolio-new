import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const { id: offerId } = await params;

  const offer = await prisma.offer.findUnique({ where: { id: offerId }, include: { request: true } });
  if (!offer || offer.request.clientId !== session.user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (offer.status !== "PENDING") {
    return NextResponse.json({ error: "OFFER_NOT_PENDING" }, { status: 409 });
  }

  await prisma.offer.update({ where: { id: offerId }, data: { status: "REJECTED" } });

  return NextResponse.json({ ok: true });
}
