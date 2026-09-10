import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiRole("ADMIN");
  if (error) return error;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const approve = body?.approve !== false;

  const carrier = await prisma.carrier.update({
    where: { id },
    data: { status: approve ? "APPROVED" : "REJECTED" },
  });

  return NextResponse.json({ carrier });
}
