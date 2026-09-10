import { prisma } from "@/lib/prisma";

export interface AvailabilityCheckInput {
  vehicleId: string;
  driverId: string;
  start: Date;
  end: Date;
  excludeBookingId?: string;
}

export interface AvailabilityConflict {
  type: "vehicle" | "driver";
  bookingId: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: AvailabilityConflict[];
}

// Availability is enforced against confirmed Booking rows only, not pending
// offers — multiple carriers/offers shouldn't block each other before a
// client actually confirms.
export async function checkAvailability({
  vehicleId,
  driverId,
  start,
  end,
  excludeBookingId,
}: AvailabilityCheckInput): Promise<AvailabilityResult> {
  const overlapping = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      OR: [{ vehicleId }, { driverId }],
      request: {
        departureAt: {
          gte: new Date(start.getTime() - 3 * 60 * 60 * 1000),
          lte: new Date(end.getTime() + 3 * 60 * 60 * 1000),
        },
      },
    },
    select: { id: true, vehicleId: true, driverId: true },
  });

  const conflicts: AvailabilityConflict[] = overlapping.flatMap((booking) => {
    const found: AvailabilityConflict[] = [];
    if (booking.vehicleId === vehicleId) {
      found.push({ type: "vehicle", bookingId: booking.id });
    }
    if (booking.driverId === driverId) {
      found.push({ type: "driver", bookingId: booking.id });
    }
    return found;
  });

  return { available: conflicts.length === 0, conflicts };
}
