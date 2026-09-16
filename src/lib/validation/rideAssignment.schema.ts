import { z } from "zod";

// Carrier assigning (or reassigning) a vehicle and/or driver to a ride, with
// an optional price. Either field alone is valid — the calendar's drag-and
// -drop assigns one resource at a time (a vehicle row or a driver row); the
// dropdown-based assign form sends both together. No separate offer/accept
// step either way — this is a direct edit.
export const rideAssignmentSchema = z
  .object({
    vehicleId: z.string().min(1).optional(),
    driverId: z.string().min(1).optional(),
    distanceKm: z.coerce.number().positive().optional(),
    price: z.coerce.number().positive().optional(),
    // Set after the dispatcher confirms past an availability warning —
    // bypasses the conflict check rather than blocking the assignment.
    force: z.coerce.boolean().default(false),
  })
  .refine((data) => data.vehicleId || data.driverId, {
    message: "vehicleId or driverId is required",
    path: ["vehicleId"],
  });
