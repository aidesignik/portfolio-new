import { z } from "zod";

// Carrier assigning (or reassigning) a vehicle + driver to a ride, with an
// optional price. No separate offer/accept step — this is a direct edit.
export const rideAssignmentSchema = z.object({
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  distanceKm: z.coerce.number().positive().optional(),
  price: z.coerce.number().positive().optional(),
});
