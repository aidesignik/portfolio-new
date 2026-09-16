import { z } from "zod";

export const cityLocationSchema = z.object({
  city: z.string().min(1),
  location: z.string().min(1),
});

export const createRideSchema = z
  .object({
    pickupCity: z.string().min(1),
    pickupLocation: z.string().min(1),
    destinationCity: z.string().min(1),
    destinationLocation: z.string().min(1),
    stops: z.array(cityLocationSchema).max(5).default([]),
    departureAt: z.coerce.date(),
    isRoundTrip: z.coerce.boolean().default(false),
    returnAt: z.coerce.date().optional(),
    // The return leg defaults to the outbound leg reversed — these are only
    // set when a different pickup/destination/stops is picked for the way
    // back (see resolveReturnLeg()).
    returnPickupCity: z.string().min(1).optional(),
    returnPickupLocation: z.string().min(1).optional(),
    returnStops: z.array(cityLocationSchema).max(5).default([]),
    returnDestinationCity: z.string().min(1).optional(),
    returnDestinationLocation: z.string().min(1).optional(),
    passengerCount: z.coerce.number().int().min(1).max(200),
    specialRequests: z.string().optional(),
    // Set after the dispatcher confirms past an availability warning —
    // bypasses the conflict check rather than blocking the edit. Only
    // meaningful for the carrier-side ride edit (PATCH /api/carrier/rides/
    // [id]); ignored by the client-facing request flow.
    force: z.coerce.boolean().default(false),
  })
  .refine((data) => !data.isRoundTrip || data.returnAt !== undefined, {
    message: "returnAt is required for a round trip",
    path: ["returnAt"],
  })
  .refine((data) => !data.returnAt || data.returnAt > data.departureAt, {
    message: "returnAt must be after departureAt",
    path: ["returnAt"],
  });
