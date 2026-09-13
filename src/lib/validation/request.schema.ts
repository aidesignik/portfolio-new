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
    passengerCount: z.coerce.number().int().min(1).max(200),
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
