export interface TripQueryParams {
  pickupAddress: string;
  destinationAddress: string;
  departureAt: string;
  isRoundTrip: boolean;
  returnAt?: string;
  passengerCount: string;
  estimatedDistanceKm?: string;
}

/** Reads trip search params carried in the URL (e.g. from the public landing search) into a plain object. */
export function readTripQueryParams(
  params: URLSearchParams,
): TripQueryParams | null {
  const pickupAddress = params.get("pickupAddress");
  const destinationAddress = params.get("destinationAddress");
  const departureAt = params.get("departureAt");
  const passengerCount = params.get("passengerCount");
  if (!pickupAddress || !destinationAddress || !departureAt || !passengerCount) {
    return null;
  }

  return {
    pickupAddress,
    destinationAddress,
    departureAt,
    isRoundTrip: params.get("isRoundTrip") === "on",
    returnAt: params.get("returnAt") ?? undefined,
    passengerCount,
    estimatedDistanceKm: params.get("estimatedDistanceKm") ?? undefined,
  };
}

/** Builds the request-creation payload from carried trip params. */
export function tripQueryParamsToRequestBody(trip: TripQueryParams) {
  return {
    pickupAddress: trip.pickupAddress,
    destinationAddress: trip.destinationAddress,
    departureAt: trip.departureAt,
    isRoundTrip: trip.isRoundTrip,
    returnAt: trip.isRoundTrip ? trip.returnAt : undefined,
    passengerCount: trip.passengerCount,
    estimatedDistanceKm: trip.estimatedDistanceKm,
  };
}
