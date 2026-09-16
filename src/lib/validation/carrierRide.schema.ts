import { z } from "zod";
import { cityLocationSchema } from "./request.schema";

// A carrier logging a ride they already arranged themselves (e.g. by phone)
// — combines the client's trip-request fields with the carrier's own
// offer fields (vehicle/driver/price), since there's no separate
// request → offer → accept dance when the carrier is on both sides.
export const carrierRideSchema = z
  .object({
    clientName: z.string().min(1),
    clientEmail: z.string().email(),
    clientPhone: z.string().optional(),

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

    vehicleId: z.string().min(1),
    driverId: z.string().min(1),
    // Optional: left blank, the server calculates it the same way the
    // client-facing request flow does (geocode + route); only needed as a
    // manual override/fallback when that can't resolve an address.
    distanceKm: z.coerce.number().positive().optional(),
    finalPrice: z.coerce.number().positive(),
  })
  .refine((data) => !data.isRoundTrip || data.returnAt !== undefined, {
    message: "returnAt is required for a round trip",
    path: ["returnAt"],
  })
  .refine((data) => !data.returnAt || data.returnAt > data.departureAt, {
    message: "returnAt must be after departureAt",
    path: ["returnAt"],
  });
