import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { driverSchema } from "@/lib/validation/driver.schema";

async function loadOwnedDriver(userId: string, driverId: string) {
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId } });
  return prisma.driver.findFirst({ where: { id: driverId, carrierId: carrier.id } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const driver = await loadOwnedDriver(session.user.id, id);
  if (!driver) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ driver });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const existing = await loadOwnedDriver(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = driverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { vehicleIds, ...data } = parsed.data;

  const driver = await prisma.$transaction(async (tx) => {
    await tx.driverVehicle.deleteMany({ where: { driverId: id } });
    return tx.driver.update({
      where: { id },
      data: {
        ...data,
        vehicles: { create: vehicleIds.map((vehicleId) => ({ vehicleId })) },
      },
    });
  });

  return NextResponse.json({ driver });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const existing = await loadOwnedDriver(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.driverVehicle.deleteMany({ where: { driverId: id } });
  await prisma.driver.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
