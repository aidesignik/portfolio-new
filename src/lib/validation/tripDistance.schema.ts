import { z } from "zod";

// Unlike the booking schemas (request/quickRide/carrierRide), the exact
// address isn't required here — this endpoint only needs enough to attempt
// a geocode, and estimateRouteDistance() already falls back to the city
// alone when location is blank. Requiring the address too just meant the
// preview couldn't show anything until a carrier had typed it, even though
// picking the cities is what the figure is actually based on.
const previewWaypointSchema = z.object({
  city: z.string().min(1),
  location: z.string().default(""),
});

// Shared by the carrier and public distance-preview endpoints — pickup/
// stops/destination (and, for a round trip, the return leg) with no
// vehicle/driver/price needed.
export const tripDistanceSchema = z.object({
  pickupCity: z.string().min(1),
  pickupLocation: z.string().default(""),
  destinationCity: z.string().min(1),
  destinationLocation: z.string().default(""),
  stops: z.array(previewWaypointSchema).max(5).default([]),
  isRoundTrip: z.coerce.boolean().default(false),
  returnPickupCity: z.string().min(1).optional(),
  returnPickupLocation: z.string().optional(),
  returnStops: z.array(previewWaypointSchema).max(5).default([]),
  returnDestinationCity: z.string().min(1).optional(),
  returnDestinationLocation: z.string().optional(),
});
