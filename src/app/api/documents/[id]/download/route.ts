import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { read } from "@/lib/documents/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { id } = await params;

  const document = await prisma.document.findUnique({ where: { id }, include: { booking: true } });
  if (!document || !document.fileUrl || document.status !== "GENERATED") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const booking = document.booking;
  const isClient = session.user.role === "CLIENT" && booking.clientId === session.user.id;
  const isCarrier = session.user.role === "CARRIER" && booking.carrierId === session.user.carrierId;
  const isAdmin = session.user.role === "ADMIN";
  if (!isClient && !isCarrier && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const buffer = await read(document.fileUrl);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.type.toLowerCase()}-${document.number}.pdf"`,
    },
  });
}
