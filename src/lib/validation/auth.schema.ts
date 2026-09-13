import { z } from "zod";

export const clientRegisterSchema = z.object({
  role: z.literal("CLIENT"),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

// Carrier sign-up only creates the login itself; company details (contact
// person, company name, tax ID, city, description) are collected right
// after, on the same onboarding-completion step Google sign-in uses.
export const carrierRegisterSchema = z.object({
  role: z.literal("CARRIER"),
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.discriminatedUnion("role", [
  clientRegisterSchema,
  carrierRegisterSchema,
]);
