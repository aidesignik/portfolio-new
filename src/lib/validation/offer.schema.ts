import { z } from "zod";

export const offerSchema = z.object({
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  distanceKm: z.coerce.number().positive(),
  finalPrice: z.coerce.number().positive(),
  notes: z.string().optional(),
});
