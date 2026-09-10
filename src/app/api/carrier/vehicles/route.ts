import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validation/vehicle.schema";

export async function GET() {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const vehicles = await prisma.vehicle.findMany({
    where: { carrierId: carrier.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = vehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const vehicle = await prisma.vehicle.create({
    data: { ...parsed.data, carrierId: carrier.id },
  });

  return NextResponse.json({ vehicle }, { status: 201 });
}
