import { z } from "zod";

export const offerSchema = z.object({
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  // Optional: defaults to the request's own auto-calculated distance;
  // only sent when the carrier explicitly overrides it.
  distanceKm: z.coerce.number().positive().optional(),
  finalPrice: z.coerce.number().positive(),
  notes: z.string().optional(),
});
