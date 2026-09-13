import { prisma } from "@/lib/prisma";

export interface AvailabilityCheckInput {
  vehicleId?: string;
  driverId?: string;
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

// Checks whichever of vehicleId/driverId is given — the calendar's drag-and
// -drop assigns one resource (a vehicle row or a driver row) at a time, so
// this is often called with only one of the two. Any ride already assigned
// to that resource (PENDING or CONFIRMED — assigning it is what puts it on
// the schedule, not just confirming it) or a Block overlapping the window
// counts as a conflict.
export async function checkAvailability({
  vehicleId,
  driverId,
  start,
  end,
  excludeRideId,
}: AvailabilityCheckInput): Promise<AvailabilityResult> {
  if (!vehicleId && !driverId) return { available: true, conflicts: [] };

  const windowStart = new Date(start.getTime() - 3 * 60 * 60 * 1000);
  const windowEnd = new Date(end.getTime() + 3 * 60 * 60 * 1000);
  const resourceOr = [
    ...(vehicleId ? [{ vehicleId }] : []),
    ...(driverId ? [{ driverId }] : []),
  ];

  const [overlappingRides, overlappingBlocks] = await Promise.all([
    prisma.ride.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        id: excludeRideId ? { not: excludeRideId } : undefined,
        OR: resourceOr,
        departureAt: { gte: windowStart, lte: windowEnd },
      },
      select: { id: true, vehicleId: true, driverId: true },
    }),
    prisma.block.findMany({
      where: {
        OR: resourceOr,
        startAt: { lte: windowEnd },
        endAt: { gte: windowStart },
      },
      select: { id: true, vehicleId: true, driverId: true },
    }),
  ]);

  const conflicts: AvailabilityConflict[] = [
    ...overlappingRides.flatMap((ride) => {
      const found: AvailabilityConflict[] = [];
      if (vehicleId && ride.vehicleId === vehicleId) found.push({ type: "vehicle", rideId: ride.id });
      if (driverId && ride.driverId === driverId) found.push({ type: "driver", rideId: ride.id });
      return found;
    }),
    ...overlappingBlocks.map((block) => ({ type: "block" as const, blockId: block.id })),
  ];

  return { available: conflicts.length === 0, conflicts };
}
