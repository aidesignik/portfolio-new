import { z } from "zod";

export const carrierProfileSchema = z.object({
  companyName: z.string().min(1),
  taxId: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  city: z.string().min(1),
  description: z.string().optional(),
  licenseInfo: z.string().optional(),
  ratePerKm: z.coerce.number().positive().optional(),
  fixedFee: z.coerce.number().min(0).optional(),
});
