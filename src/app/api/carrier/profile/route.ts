import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { carrierProfileSchema } from "@/lib/validation/carrier.schema";

export async function GET() {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const carrier = await prisma.carrier.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ carrier });
}

export async function PATCH(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = carrierProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { contactPerson, ...carrierData } = parsed.data;

  let carrier;
  try {
    carrier = await prisma.carrier.upsert({
      where: { userId: session.user.id },
      update: carrierData,
      // Approval gate is disabled for now — every new carrier is auto-approved.
      create: { ...carrierData, userId: session.user.id, status: "APPROVED" },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json({ error: "TAX_ID_IN_USE" }, { status: 409 });
    }
    throw err;
  }

  if (contactPerson) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: contactPerson },
    });
  }

  return NextResponse.json({ carrier });
}
