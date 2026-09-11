import { prisma } from "@/lib/prisma";
import { suggestPrice } from "@/lib/pricing";

export interface AvailableOption {
  carrierId: string;
  carrierName: string;
  carrierCity: string;
  carrierDescription: string | null;
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  amenities: string[];
  photos: string[];
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
  returnAt,
  estimatedDistanceKm,
}: {
  passengerCount: number;
  departureAt: Date;
  returnAt: Date | null;
  estimatedDistanceKm: number | null;
}): Promise<AvailableOption[]> {
  const tripEnd =
    returnAt ?? new Date(departureAt.getTime() + AVERAGE_TRIP_DURATION_HOURS * 60 * 60 * 1000);
  const windowStart = new Date(departureAt.getTime() - 3 * 60 * 60 * 1000);
  const windowEnd = new Date(tripEnd.getTime() + 3 * 60 * 60 * 1000);
  // A round trip covers roughly double the one-way distance the client gave us.
  const priceDistanceKm = returnAt && estimatedDistanceKm ? estimatedDistanceKm * 2 : estimatedDistanceKm;

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
    carrierDescription: vehicle.carrier.description,
    vehicleId: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    seats: vehicle.seats,
    amenities: vehicle.amenities,
    photos: vehicle.photos,
    estimatedPrice: priceDistanceKm
      ? suggestPrice(priceDistanceKm, {
          ratePerKm: vehicle.carrier.ratePerKm ? Number(vehicle.carrier.ratePerKm) : null,
          fixedFee: vehicle.carrier.fixedFee ? Number(vehicle.carrier.fixedFee) : null,
        })
      : null,
  }));
}
