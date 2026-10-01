import { z } from "zod";
import { cityLocationSchema } from "./request.schema";

// Shared by the carrier and public distance-preview endpoints — pickup/
// stops/destination (and, for a round trip, the return leg) with no
// vehicle/driver/price needed.
export const tripDistanceSchema = z.object({
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
