import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { read } from "@/lib/documents/storage";
import { isEmailConfigured, sendMail } from "@/lib/mail";
import { formatRoute } from "@/lib/location";
import type { DocumentType } from "@prisma/client";

const VALID_TYPES: DocumentType[] = ["CONTRACT", "CONFIRMATION", "INVOICE"];
const DOCUMENT_LABEL: Record<DocumentType, string> = {
  CONTRACT: "Contract",
  CONFIRMATION: "Booking confirmation",
  INVOICE: "Invoice",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only a carrier (or an admin on their behalf) emails documents to a
// client — the client themselves already sees these on their own booking
// page, so this route isn't reachable from that role regardless of what
// the UI shows.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: { client: { select: { email: true } } },
  });
  if (!ride) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const isCarrier = session.user.role === "CARRIER" && ride.carrierId === session.user.carrierId;
  const isAdmin = session.user.role === "ADMIN";
  if (!isCarrier && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "EMAIL_NOT_CONFIGURED" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  const types = Array.isArray(body?.types) ? (body.types as DocumentType[]).filter((t) => VALID_TYPES.includes(t)) : [];

  if (!EMAIL_RE.test(to)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }
  if (types.length === 0) {
    return NextResponse.json({ error: "NO_TYPES" }, { status: 400 });
  }

  const documents = await prisma.document.findMany({
    where: { rideId: id, type: { in: types }, status: "GENERATED" },
  });
  const ready = documents.filter((d) => d.fileUrl);
  if (ready.length === 0) {
    return NextResponse.json({ error: "NO_DOCUMENTS_READY" }, { status: 409 });
  }

  const attachments = await Promise.all(
    ready.map(async (doc) => ({
      filename: `${doc.type.toLowerCase()}-${doc.number ?? doc.id}.pdf`,
      content: await read(doc.fileUrl!),
    })),
  );

  const route = formatRoute(ride);
  const docList = ready.map((d) => `<li>${DOCUMENT_LABEL[d.type]}</li>`).join("");
  await sendMail({
    to,
    subject: `Your documents for ${route}`,
    html: `<p>Hello,</p><p>Please find attached the following document${ready.length > 1 ? "s" : ""} for your trip (${route}):</p><ul>${docList}</ul><p>Thank you.</p>`,
    attachments,
  });

  const now = new Date();
  await prisma.document.updateMany({
    where: { id: { in: ready.map((d) => d.id) } },
    data: { emailedAt: now, emailedTo: to },
  });

  return NextResponse.json({ ok: true, sentTypes: ready.map((d) => d.type) });
}
