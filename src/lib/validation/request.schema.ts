import { z } from "zod";

export const bookingRequestSchema = z.object({
  pickupAddress: z.string().min(1),
  destinationAddress: z.string().min(1),
  departureAt: z.coerce.date(),
  passengerCount: z.coerce.number().int().min(1).max(200),
  specialRequests: z.string().optional(),
});
