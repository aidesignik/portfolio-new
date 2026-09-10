import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { driverSchema } from "@/lib/validation/driver.schema";

export async function GET() {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const drivers = await prisma.driver.findMany({
    where: { carrierId: carrier.id },
    include: { vehicles: { include: { vehicle: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ drivers });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = driverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const { vehicleIds, ...data } = parsed.data;

  const driver = await prisma.driver.create({
    data: {
      ...data,
      carrierId: carrier.id,
      vehicles: {
        create: vehicleIds.map((vehicleId) => ({ vehicleId })),
      },
    },
  });

  return NextResponse.json({ driver }, { status: 201 });
}
