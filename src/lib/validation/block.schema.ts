import { z } from "zod";

export const blockReasons = ["MAINTENANCE", "DAY_OFF", "VACATION", "OTHER"] as const;

// Exactly one of vehicleId/driverId — enforced here rather than as a DB
// check constraint, matching this app's existing pattern.
export const blockSchema = z
  .object({
    vehicleId: z.string().min(1).optional(),
    driverId: z.string().min(1).optional(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    reason: z.enum(blockReasons),
    note: z.string().optional(),
  })
  .refine((data) => Boolean(data.vehicleId) !== Boolean(data.driverId), {
    message: "Exactly one of vehicleId or driverId is required",
    path: ["vehicleId"],
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });
