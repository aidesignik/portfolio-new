import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { carrierProfileSchema } from "@/lib/validation/carrier.schema";
import { remove as removeLogoFile } from "@/lib/uploads/logoStorage";

const LOGO_ROUTE_PREFIX = "/api/carrier/logo/";

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

  const existing = await prisma.carrier.findUnique({
    where: { userId: session.user.id },
    select: { logoUrl: true },
  });

  let carrier;
  try {
    carrier = await prisma.carrier.upsert({
      where: { userId: session.user.id },
      update: parsed.data,
      // Approval gate is disabled for now — every new carrier is auto-approved.
      create: { ...parsed.data, userId: session.user.id, status: "APPROVED" },
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

  // Clean up the previously uploaded file once it's no longer referenced —
  // either the logo was removed, or replaced by a newly uploaded one.
  if (
    existing?.logoUrl &&
    existing.logoUrl !== carrier.logoUrl &&
    existing.logoUrl.startsWith(LOGO_ROUTE_PREFIX)
  ) {
    await removeLogoFile(existing.logoUrl.slice(LOGO_ROUTE_PREFIX.length));
  }

  return NextResponse.json({ carrier });
}
