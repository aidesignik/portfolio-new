import { z } from "zod";
import { cityLocationSchema } from "./request.schema";

// The calendar's "+ New Ride" quick-create form — client + trip details
// only, no vehicle/driver/price. Lands in the carrier's own unassigned
// queue; assignment happens afterward from the calendar itself.
export const quickRideSchema = z
  .object({
    clientName: z.string().min(1),
    clientEmail: z.string().email(),
    clientPhone: z.string().optional(),

    pickupCity: z.string().min(1),
    pickupLocation: z.string().min(1),
    destinationCity: z.string().min(1),
    destinationLocation: z.string().min(1),
    stops: z.array(cityLocationSchema).max(5).default([]),
    departureAt: z.coerce.date(),
    isRoundTrip: z.coerce.boolean().default(false),
    returnAt: z.coerce.date().optional(),
    passengerCount: z.coerce.number().int().min(1).max(200),
    specialRequests: z.string().optional(),
    // Optional "assign now" — if the carrier already knows who's free, per
    // the availability-filtered picker on the form. Left unset, the ride
    // lands in the unassigned queue as before.
    vehicleId: z.string().min(1).optional(),
    driverId: z.string().min(1).optional(),
  })
  .refine((data) => !data.isRoundTrip || data.returnAt !== undefined, {
    message: "returnAt is required for a round trip",
    path: ["returnAt"],
  })
  .refine((data) => !data.returnAt || data.returnAt > data.departureAt, {
    message: "returnAt must be after departureAt",
    path: ["returnAt"],
  });
