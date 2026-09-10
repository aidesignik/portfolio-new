import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { carrierProfileSchema } from "@/lib/validation/carrier.schema";

export async function GET() {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const carrier = await prisma.carrier.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ carrier });
}

export async function PATCH(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = carrierProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const carrier = await prisma.carrier.update({
    where: { userId: session.user.id },
    data: parsed.data,
  });

  return NextResponse.json({ carrier });
}
