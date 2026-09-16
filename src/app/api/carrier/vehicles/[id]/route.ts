import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validation/vehicle.schema";
import { remove as removePhotoFile } from "@/lib/uploads/vehiclePhotoStorage";
import { remove as removeDocFile } from "@/lib/uploads/vehicleDocStorage";

const PHOTO_ROUTE_PREFIX = "/api/carrier/vehicle-photos/";
const DOC_ROUTE_PREFIX = "/api/carrier/vehicle-docs/";

function removeOrphanedFiles(
  oldUrls: string[],
  newUrls: string[],
  prefix: string,
  removeFile: (filename: string) => Promise<void>,
) {
  const kept = new Set(newUrls);
  return Promise.all(
    oldUrls
      .filter((url) => !kept.has(url) && url.startsWith(prefix))
      .map((url) => removeFile(url.slice(prefix.length))),
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
  await Promise.all([
    removeOrphanedFiles(existing.photos, vehicle.photos, PHOTO_ROUTE_PREFIX, removePhotoFile),
    removeOrphanedFiles(existing.documentUrls, vehicle.documentUrls, DOC_ROUTE_PREFIX, removeDocFile),
  ]);
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
  await Promise.all([
    removeOrphanedFiles(existing.photos, [], PHOTO_ROUTE_PREFIX, removePhotoFile),
    removeOrphanedFiles(existing.documentUrls, [], DOC_ROUTE_PREFIX, removeDocFile),
  ]);
  return NextResponse.json({ ok: true });
}
