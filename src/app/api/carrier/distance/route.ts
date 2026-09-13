import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/auth/api";
import { estimateRouteDistance } from "@/lib/tripDistance";
import { cityLocationSchema } from "@/lib/validation/request.schema";

// Lightweight, purpose-built for a live "how many km is this?" preview as a
// carrier types pickup/stops/destination — no vehicle/driver/price needed.
const distancePreviewSchema = z.object({
  pickupCity: z.string().min(1),
  pickupLocation: z.string().min(1),
  destinationCity: z.string().min(1),
  destinationLocation: z.string().min(1),
  stops: z.array(cityLocationSchema).max(5).default([]),
});

export async function POST(request: Request) {
  const { error } = await requireApiRole("CARRIER");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = distancePreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const waypoints = [
    { city: data.pickupCity, location: data.pickupLocation },
    ...data.stops,
    { city: data.destinationCity, location: data.destinationLocation },
  ];
  const estimate = await estimateRouteDistance(waypoints).catch(() => null);
  if (!estimate) {
    return NextResponse.json({ error: "DISTANCE_UNAVAILABLE" }, { status: 422 });
  }

  return NextResponse.json({ distanceKm: estimate.distanceKm });
}
