import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validation/vehicle.schema";
import { remove as removePhotoFile } from "@/lib/uploads/vehiclePhotoStorage";

const PHOTO_ROUTE_PREFIX = "/api/carrier/vehicle-photos/";

function removeOrphanedPhotos(oldPhotos: string[], newPhotos: string[]) {
  const kept = new Set(newPhotos);
  return Promise.all(
    oldPhotos
      .filter((url) => !kept.has(url) && url.startsWith(PHOTO_ROUTE_PREFIX))
      .map((url) => removePhotoFile(url.slice(PHOTO_ROUTE_PREFIX.length))),
  );
}

async function loadOwnedVehicle(userId: string, vehicleId: string) {
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId } });
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, carrierId: carrier.id },
  });
  return vehicle;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const vehicle = await loadOwnedVehicle(session.user.id, id);
  if (!vehicle) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ vehicle });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const existing = await loadOwnedVehicle(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = vehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.update({ where: { id }, data: parsed.data });
  await removeOrphanedPhotos(existing.photos, vehicle.photos);
  return NextResponse.json({ vehicle });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const existing = await loadOwnedVehicle(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.driverVehicle.deleteMany({ where: { vehicleId: id } });
  await prisma.vehicle.delete({ where: { id } });
  await removeOrphanedPhotos(existing.photos, []);
  return NextResponse.json({ ok: true });
}
