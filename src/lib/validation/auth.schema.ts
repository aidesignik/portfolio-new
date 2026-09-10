import { z } from "zod";

export const clientRegisterSchema = z.object({
  role: z.literal("CLIENT"),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export const carrierRegisterSchema = z.object({
  role: z.literal("CARRIER"),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  companyName: z.string().min(1),
  taxId: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  city: z.string().min(1),
  description: z.string().optional(),
  licenseInfo: z.string().optional(),
});

export const registerSchema = z.discriminatedUnion("role", [
  clientRegisterSchema,
  carrierRegisterSchema,
]);
