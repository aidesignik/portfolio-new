import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { regenerateRideDocuments } from "@/lib/documents/regenerate";

const distanceOverrideSchema = z.object({
  distanceKm: z.coerce.number().positive(),
});

// A dedicated, lightweight way to override the maps-calculated distance on
// its own — the ride sheet's Trip total is auto-computed, but a carrier who
// disagrees with the estimate (a detour the map doesn't know about, a
// closed road, etc.) can correct it without resending the whole trip-edit
// payload. Doesn't touch price — the carrier adjusts that separately if the
// corrected distance changes what they'd charge.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = distanceOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });
  const ride = await prisma.ride.findFirst({ where: { id, carrierId: carrier.id } });
  if (!ride) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (ride.status === "CANCELLED" || ride.status === "COMPLETED") {
    return NextResponse.json({ error: "RIDE_NOT_EDITABLE" }, { status: 409 });
  }

  const updated = await prisma.ride.update({
    where: { id },
    data: { estimatedDistanceKm: parsed.data.distanceKm },
  });

  await regenerateRideDocuments(updated.id);

  return NextResponse.json({ ride: updated });
}
