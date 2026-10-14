import { NextResponse } from "next/server";
import { requireApiRole } from "@/auth/api";
import { prisma } from "@/lib/prisma";
import { effectiveRideEnd } from "@/lib/availability";

const AVERAGE_TRIP_DURATION_HOURS = 4;

// Which of this carrier's vehicles/drivers are already busy — used by the
// "+ New Ride" form's vehicle/driver pickers. Always returns the whole
// active fleet/roster (a carrier can deliberately assign an already-booked
// vehicle or driver, same as reassigning one on an existing ride); once a
// date is given, each entry is tagged `busy` when it has an overlapping
// ride or block, same padding-window convention as checkAvailability() in
// lib/availability.ts, so the form can flag it instead of hiding it.
export async function GET(request: Request) {
  const { session, error } = await requireApiRole("CARRIER");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const departureAtParam = searchParams.get("departureAt");
  const departureAt = departureAtParam ? new Date(departureAtParam) : null;
  if (departureAtParam && Number.isNaN(departureAt!.getTime())) {
    return NextResponse.json({ error: "INVALID_DEPARTURE_AT" }, { status: 400 });
  }
  // Set when checking availability for a ride that already exists (the
  // calendar's "Change vehicle/driver" picker) — otherwise that ride's own
  // current vehicle/driver would always show up busy against itself.
  const excludeRideId = searchParams.get("excludeRideId");

  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session.user.id } });

  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.findMany({
      where: { carrierId: carrier.id, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.driver.findMany({
      where: { carrierId: carrier.id, isAvailable: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!departureAt) {
    return NextResponse.json({ vehicles, drivers });
  }

  const returnAtParam = searchParams.get("returnAt");
  const parsedReturnAt = returnAtParam ? new Date(returnAtParam) : null;
  const end =
    parsedReturnAt && !Number.isNaN(parsedReturnAt.getTime())
      ? parsedReturnAt
      : new Date(departureAt.getTime() + AVERAGE_TRIP_DURATION_HOURS * 60 * 60 * 1000);
  const windowStart = new Date(departureAt.getTime() - 3 * 60 * 60 * 1000);
  const windowEnd = new Date(end.getTime() + 3 * 60 * 60 * 1000);

  const [candidateRides, overlappingBlocks] = await Promise.all([
    prisma.ride.findMany({
      where: {
        carrierId: carrier.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        ...(excludeRideId ? { id: { not: excludeRideId } } : {}),
        // A ride's own end can be arbitrarily far past its departure (a
        // multi-day round trip) — this only filters the one bound cheap in
        // SQL, the exact overlap is checked below in JS.
        departureAt: { lte: windowEnd },
      },
      select: { vehicleId: true, driverId: true, departureAt: true, returnAt: true },
    }),
    prisma.block.findMany({
      where: { carrierId: carrier.id, startAt: { lte: windowEnd }, endAt: { gte: windowStart } },
      select: { vehicleId: true, driverId: true },
    }),
  ]);

  const overlappingRides = candidateRides.filter((ride) => {
    const rideEnd = effectiveRideEnd(ride.departureAt, ride.returnAt);
    return ride.departureAt <= windowEnd && windowStart <= rideEnd;
  });

  const busyVehicleIds = new Set(
    [...overlappingRides, ...overlappingBlocks].map((r) => r.vehicleId).filter((id): id is string => Boolean(id)),
  );
  const busyDriverIds = new Set(
    [...overlappingRides, ...overlappingBlocks].map((r) => r.driverId).filter((id): id is string => Boolean(id)),
  );

  return NextResponse.json({
    vehicles: vehicles.map((v) => ({ ...v, busy: busyVehicleIds.has(v.id) })),
    drivers: drivers.map((d) => ({ ...d, busy: busyDriverIds.has(d.id) })),
  });
}
