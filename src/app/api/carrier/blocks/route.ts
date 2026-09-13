import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { blockSchema } from "@/lib/validation/block.schema";

export async function GET() {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const blocks = await prisma.block.findMany({
    where: { carrierId: carrier.id },
    orderBy: { startAt: "asc" },
  });
  return NextResponse.json({ blocks });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({ where: { id: data.vehicleId, carrierId: carrier.id } });
    if (!vehicle) return NextResponse.json({ error: "VEHICLE_NOT_FOUND" }, { status: 404 });
  }
  if (data.driverId) {
    const driver = await prisma.driver.findFirst({ where: { id: data.driverId, carrierId: carrier.id } });
    if (!driver) return NextResponse.json({ error: "DRIVER_NOT_FOUND" }, { status: 404 });
  }

  const block = await prisma.block.create({
    data: { ...data, carrierId: carrier.id },
  });
  return NextResponse.json({ block }, { status: 201 });
}
