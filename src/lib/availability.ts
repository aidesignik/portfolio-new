import { prisma } from "@/lib/prisma";

export interface AvailabilityCheckInput {
  vehicleId: string;
  driverId: string;
  start: Date;
  end: Date;
  excludeRideId?: string;
}

export interface AvailabilityConflict {
  type: "vehicle" | "driver" | "block";
  rideId?: string;
  blockId?: string;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: AvailabilityConflict[];
}

// Availability is enforced against confirmed Ride rows and Block entries
// only — an unassigned/pending Ride shouldn't block anything before a
// carrier actually confirms it.
export async function checkAvailability({
  vehicleId,
  driverId,
  start,
  end,
  excludeRideId,
}: AvailabilityCheckInput): Promise<AvailabilityResult> {
  const windowStart = new Date(start.getTime() - 3 * 60 * 60 * 1000);
  const windowEnd = new Date(end.getTime() + 3 * 60 * 60 * 1000);

  const [overlappingRides, overlappingBlocks] = await Promise.all([
    prisma.ride.findMany({
      where: {
        status: "CONFIRMED",
        id: excludeRideId ? { not: excludeRideId } : undefined,
        OR: [{ vehicleId }, { driverId }],
        departureAt: { gte: windowStart, lte: windowEnd },
      },
      select: { id: true, vehicleId: true, driverId: true },
    }),
    prisma.block.findMany({
      where: {
        OR: [{ vehicleId }, { driverId }],
        startAt: { lte: windowEnd },
        endAt: { gte: windowStart },
      },
      select: { id: true, vehicleId: true, driverId: true },
    }),
  ]);

  const conflicts: AvailabilityConflict[] = [
    ...overlappingRides.flatMap((ride) => {
      const found: AvailabilityConflict[] = [];
      if (ride.vehicleId === vehicleId) found.push({ type: "vehicle", rideId: ride.id });
      if (ride.driverId === driverId) found.push({ type: "driver", rideId: ride.id });
      return found;
    }),
    ...overlappingBlocks.map((block) => ({ type: "block" as const, blockId: block.id })),
  ];

  return { available: conflicts.length === 0, conflicts };
}
