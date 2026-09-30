import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/auth/api";
import { estimateRouteDistance } from "@/lib/tripDistance";
import { cityLocationSchema } from "@/lib/validation/request.schema";
import { resolveReturnLeg } from "@/lib/rideReturnLeg";

// Lightweight, purpose-built for a live "how many km is this?" preview as a
// carrier types pickup/stops/destination (and, for a round trip, the
// return leg) — no vehicle/driver/price needed. For a round trip, the
// return leg defaults to the outbound endpoints swapped with no stops
// assumed, same as resolveReturnLeg() — only overridden by whatever the
// carrier explicitly entered for the way back.
const distancePreviewSchema = z.object({
  pickupCity: z.string().min(1),
  pickupLocation: z.string().min(1),
  destinationCity: z.string().min(1),
  destinationLocation: z.string().min(1),
  stops: z.array(cityLocationSchema).max(5).default([]),
  isRoundTrip: z.coerce.boolean().default(false),
  returnPickupCity: z.string().min(1).optional(),
  returnPickupLocation: z.string().min(1).optional(),
  returnStops: z.array(cityLocationSchema).max(5).default([]),
  returnDestinationCity: z.string().min(1).optional(),
  returnDestinationLocation: z.string().min(1).optional(),
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

  const outboundWaypoints = [
    { city: data.pickupCity, location: data.pickupLocation },
    ...data.stops,
    { city: data.destinationCity, location: data.destinationLocation },
  ];
  const outboundEstimate = await estimateRouteDistance(outboundWaypoints).catch(() => null);
  if (!outboundEstimate) {
    return NextResponse.json({ error: "DISTANCE_UNAVAILABLE" }, { status: 422 });
  }

  if (!data.isRoundTrip) {
    return NextResponse.json({ distanceKm: outboundEstimate.distanceKm });
  }

  const returnLeg = resolveReturnLeg(
    {
      pickupCity: data.pickupCity,
      pickupLocation: data.pickupLocation,
      destinationCity: data.destinationCity,
      destinationLocation: data.destinationLocation,
      stops: data.stops,
    },
    {
      returnPickupCity: data.returnPickupCity,
      returnPickupLocation: data.returnPickupLocation,
      returnStops: data.returnStops,
      returnDestinationCity: data.returnDestinationCity,
      returnDestinationLocation: data.returnDestinationLocation,
    },
  );
  const returnWaypoints = [
    { city: returnLeg.pickupCity, location: returnLeg.pickupLocation },
    ...returnLeg.stops,
    { city: returnLeg.destinationCity, location: returnLeg.destinationLocation },
  ];
  const returnEstimate = await estimateRouteDistance(returnWaypoints).catch(() => null);
  if (!returnEstimate) {
    return NextResponse.json({ error: "DISTANCE_UNAVAILABLE" }, { status: 422 });
  }

  return NextResponse.json({ distanceKm: outboundEstimate.distanceKm + returnEstimate.distanceKm });
}
