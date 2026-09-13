import { z } from "zod";

export const vehicleAmenities = ["AC", "WIFI", "USB", "TOILET"] as const;
export const vehicleStatuses = ["ACTIVE", "INACTIVE"] as const;
export const vehicleTypes = ["VAN", "MINIBUS", "MIDIBUS", "COACH"] as const;

export const vehicleSchema = z.object({
  type: z.enum(vehicleTypes),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  seats: z.coerce.number().int().min(1).max(200),
  amenities: z.array(z.enum(vehicleAmenities)).default([]),
  status: z.enum(vehicleStatuses).default("ACTIVE"),
  photos: z.array(z.string().url()).max(10).default([]),
});
