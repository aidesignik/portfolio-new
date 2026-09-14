import { z } from "zod";

export const carrierProfileSchema = z.object({
  companyName: z.string().min(1),
  taxId: z.string().min(1),
  // "Matični broj" — the company's business registration number.
  registrationNumber: z.string().min(1),
  // "Odgovorno lice" — the company's legally authorized representative.
  legalRepresentative: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1).optional(),
  city: z.string().min(1),
  address: z.string().min(1).optional(),
  description: z.string().optional(),
  licenseInfo: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  ratePerKm: z.coerce.number().positive().optional(),
  fixedFee: z.coerce.number().min(0).optional(),
});
