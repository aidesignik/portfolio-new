import { z } from "zod";

export const driverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  isAvailable: z.coerce.boolean().default(true),
  vehicleIds: z.array(z.string()).default([]),
});
