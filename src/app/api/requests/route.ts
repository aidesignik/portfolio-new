import { NextResponse } from "next/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { bookingRequestSchema } from "@/lib/validation/request.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const requests = await prisma.bookingRequest.findMany({
    where: { clientId: session.user.id },
    include: { offers: { include: { carrier: true, vehicle: true, driver: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.bookingRequest.create({
    data: { ...parsed.data, clientId: session.user.id },
  });

  return NextResponse.json({ request: created }, { status: 201 });
}
