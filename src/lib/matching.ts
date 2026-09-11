import { prisma } from "@/lib/prisma";
import { suggestPrice } from "@/lib/pricing";

export interface AvailableOption {
  carrierId: string;
  carrierName: string;
  carrierCity: string;
  vehicleId: string;
  make: string;
  model: string;
  seats: number;
  amenities: string[];
  estimatedPrice: number | null;
}

const AVERAGE_TRIP_DURATION_HOURS = 4;

/**
 * Read-only preview shown to the client right after submitting a request:
 * which approved carriers currently have a free, big-enough vehicle, and a
 * rough price from that carrier's own rate/km + fixed fee. Not an offer —
 * the carrier still confirms vehicle, driver and final price explicitly.
 */
export async function findAvailableOptions({
  passengerCount,
  departureAt,
  estimatedDistanceKm,
}: {
  passengerCount: number;
  departureAt: Date;
  estimatedDistanceKm: number | null;
}): Promise<AvailableOption[]> {
  const windowStart = new Date(departureAt.getTime() - 3 * 60 * 60 * 1000);
  const windowEnd = new Date(
    departureAt.getTime() + (AVERAGE_TRIP_DURATION_HOURS + 3) * 60 * 60 * 1000,
  );

  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: "ACTIVE",
      seats: { gte: passengerCount },
      carrier: { status: "APPROVED" },
      bookings: {
        none: {
          status: { in: ["CONFIRMED", "IN_PROGRESS"] },
          request: { departureAt: { gte: windowStart, lte: windowEnd } },
        },
      },
    },
    include: { carrier: true },
    orderBy: { seats: "asc" },
  });

  return vehicles.map((vehicle) => ({
    carrierId: vehicle.carrierId,
    carrierName: vehicle.carrier.companyName,
    carrierCity: vehicle.carrier.city,
    vehicleId: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    seats: vehicle.seats,
    amenities: vehicle.amenities,
    estimatedPrice: estimatedDistanceKm
      ? suggestPrice(estimatedDistanceKm, {
          ratePerKm: vehicle.carrier.ratePerKm ? Number(vehicle.carrier.ratePerKm) : null,
          fixedFee: vehicle.carrier.fixedFee ? Number(vehicle.carrier.fixedFee) : null,
        })
      : null,
  }));
}
