import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const block = await prisma.block.findFirst({ where: { id, carrierId: carrier.id } });
  if (!block) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.block.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
