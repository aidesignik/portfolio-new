import { prisma } from "@/lib/prisma";

const PADDING_MS = 3 * 60 * 60 * 1000;
// v1 simplification: a one-way ride with no returnAt is treated as busy for
// this long from departure. No partial/multi-leg availability — a ride's
// busy period is always its full departure-to-return span treated as one
// continuous block, even though the actual driving only happens on the
// first and last day of a multi-day trip.
const AVERAGE_TRIP_DURATION_MS = 4 * 60 * 60 * 1000;

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
  start: Date;
  end: Date;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: AvailabilityConflict[];
}

export function effectiveRideEnd(departureAt: Date, returnAt: Date | null): Date {
  return returnAt ?? new Date(departureAt.getTime() + AVERAGE_TRIP_DURATION_MS);
}

function spansOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

// Checks whichever of vehicleId/driverId is given — the calendar's drag-and
// -drop assigns one resource (a vehicle row or a driver row) at a time, so
// this is often called with only one of the two. Any ride already assigned
// to that resource (PENDING or CONFIRMED — assigning it is what puts it on
// the schedule, not just confirming it) or a Block overlapping the window
// counts as a conflict — a ride's whole departure-to-return span counts as
// busy, not just its departure moment.
//
// This is advisory, not enforced: callers return these conflicts as a 409
// UNAVAILABLE the first time, but accept a `force` flag to bypass the check
// and assign anyway — the dispatcher may know the resource is actually
// free for part of a span the system shows as busy.
export async function checkAvailability({
  vehicleId,
  driverId,
  start,
  end,
  excludeRideId,
}: AvailabilityCheckInput): Promise<AvailabilityResult> {
  if (!vehicleId && !driverId) return { available: true, conflicts: [] };

  const windowStart = new Date(start.getTime() - PADDING_MS);
  const windowEnd = new Date(end.getTime() + PADDING_MS);
  const resourceOr = [
    ...(vehicleId ? [{ vehicleId }] : []),
    ...(driverId ? [{ driverId }] : []),
  ];

  const [candidateRides, overlappingBlocks] = await Promise.all([
    prisma.ride.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        id: excludeRideId ? { not: excludeRideId } : undefined,
        OR: resourceOr,
        // A ride's own end can be arbitrarily far past its departure (a
        // multi-day round trip), so this only filters on the one bound we
        // know cheaply in SQL — the exact overlap is checked below in JS.
        departureAt: { lte: windowEnd },
      },
      select: { id: true, vehicleId: true, driverId: true, departureAt: true, returnAt: true },
    }),
    prisma.block.findMany({
      where: {
        OR: resourceOr,
        startAt: { lte: windowEnd },
        endAt: { gte: windowStart },
      },
      select: { id: true, vehicleId: true, driverId: true, startAt: true, endAt: true },
    }),
  ]);

  const overlappingRides = candidateRides.filter((ride) =>
    spansOverlap(windowStart, windowEnd, ride.departureAt, effectiveRideEnd(ride.departureAt, ride.returnAt)),
  );

  const conflicts: AvailabilityConflict[] = [
    ...overlappingRides.flatMap((ride) => {
      const rideEnd = effectiveRideEnd(ride.departureAt, ride.returnAt);
      const found: AvailabilityConflict[] = [];
      if (vehicleId && ride.vehicleId === vehicleId) {
        found.push({ type: "vehicle", rideId: ride.id, start: ride.departureAt, end: rideEnd });
      }
      if (driverId && ride.driverId === driverId) {
        found.push({ type: "driver", rideId: ride.id, start: ride.departureAt, end: rideEnd });
      }
      return found;
    }),
    ...overlappingBlocks.map((block) => ({
      type: "block" as const,
      blockId: block.id,
      start: block.startAt,
      end: block.endAt,
    })),
  ];

  return { available: conflicts.length === 0, conflicts };
}
