import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { error } = await requireApiRole("ADMIN");
  if (error) return error;

  const status = new URL(request.url).searchParams.get("status");

  const carriers = await prisma.carrier.findMany({
    where: status ? { status: status as never } : undefined,
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ carriers });
}
