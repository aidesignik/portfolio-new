import { z } from "zod";

export const bookingRequestSchema = z
  .object({
    pickupAddress: z.string().min(1),
    destinationAddress: z.string().min(1),
    departureAt: z.coerce.date(),
    isRoundTrip: z.coerce.boolean().default(false),
    returnAt: z.coerce.date().optional(),
    passengerCount: z.coerce.number().int().min(1).max(200),
    estimatedDistanceKm: z.coerce.number().positive().optional(),
    specialRequests: z.string().optional(),
  })
  .refine((data) => !data.isRoundTrip || data.returnAt !== undefined, {
    message: "returnAt is required for a round trip",
    path: ["returnAt"],
  })
  .refine((data) => !data.returnAt || data.returnAt > data.departureAt, {
    message: "returnAt must be after departureAt",
    path: ["returnAt"],
  });
