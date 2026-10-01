import { geocodeAddress } from "./geocoding";
import { osrmRouteDistanceKm, haversineRouteDistanceKm, type Coordinates } from "./distance";
import { formatLocation, type CityLocation } from "./location";
import { resolveReturnLeg } from "./rideReturnLeg";

export interface RouteEstimate {
  distanceKm: number;
  provider: "osrm" | "stub-haversine";
  /** Geocoded coordinates in the same order as the input waypoints, for callers that want to cache them. */
  coordinates: Coordinates[];
}

/**
 * Nominatim indexes places/addresses, not arbitrary business names — a
 * specific hotel or stop name often won't resolve on its own. Try the full
 * "location, city" string first, then fall back to the city alone so a
 * price estimate still shows even when the exact spot can't be found.
 */
async function geocodeWaypoint(waypoint: CityLocation): Promise<Coordinates | null> {
  const specific = await geocodeAddress(formatLocation(waypoint));
  if (specific) return specific;
  if (!waypoint.location) return null;
  return geocodeAddress(waypoint.city);
}

/**
 * Geocodes an ordered list of waypoints (pickup, any stops, destination —
 * at least 2), then computes the real road distance across the whole route
 * via OSRM, falling back to a haversine-based estimate if OSRM is
 * unreachable. Returns null only if one of the waypoints can't be geocoded
 * at all (city included). Geocoding is sequential (not parallel) to respect
 * Nominatim's rate limit even with several stops.
 */
export async function estimateRouteDistance(
  waypoints: CityLocation[],
): Promise<RouteEstimate | null> {
  const coordinates: Coordinates[] = [];
  for (const waypoint of waypoints) {
    const coords = await geocodeWaypoint(waypoint);
    if (!coords) return null;
    coordinates.push(coords);
  }

  try {
    const result = await osrmRouteDistanceKm(coordinates);
    return { distanceKm: result.distanceKm, provider: "osrm", coordinates };
  } catch {
    const result = haversineRouteDistanceKm(coordinates);
    return { distanceKm: result.distanceKm, provider: "stub-haversine", coordinates };
  }
}

export interface TripDistanceInput {
  pickupCity: string;
  pickupLocation: string;
  destinationCity: string;
  destinationLocation: string;
  stops: CityLocation[];
  isRoundTrip: boolean;
  returnPickupCity?: string;
  returnPickupLocation?: string;
  returnStops: CityLocation[];
  returnDestinationCity?: string;
  returnDestinationLocation?: string;
}

/**
 * Total trip distance for the live "how many km is this?" preview shared
 * by the carrier and client-facing distance endpoints — the outbound leg
 * alone for a one-way trip, outbound + return for a round trip. The return
 * leg is resolved the same way resolveReturnLeg() does for display/storage:
 * endpoints default to the outbound swapped, no stops assumed unless given.
 * Returns null if any waypoint can't be geocoded.
 */
export async function estimateTripDistance(input: TripDistanceInput): Promise<number | null> {
  const outboundWaypoints = [
    { city: input.pickupCity, location: input.pickupLocation },
    ...input.stops,
    { city: input.destinationCity, location: input.destinationLocation },
  ];
  const outboundEstimate = await estimateRouteDistance(outboundWaypoints).catch(() => null);
  if (!outboundEstimate) return null;
  if (!input.isRoundTrip) return outboundEstimate.distanceKm;

  const returnLeg = resolveReturnLeg(
    {
      pickupCity: input.pickupCity,
      pickupLocation: input.pickupLocation,
      destinationCity: input.destinationCity,
      destinationLocation: input.destinationLocation,
      stops: input.stops,
    },
    {
      returnPickupCity: input.returnPickupCity,
      returnPickupLocation: input.returnPickupLocation,
      returnStops: input.returnStops,
      returnDestinationCity: input.returnDestinationCity,
      returnDestinationLocation: input.returnDestinationLocation,
    },
  );
  const returnWaypoints = [
    { city: returnLeg.pickupCity, location: returnLeg.pickupLocation },
    ...returnLeg.stops,
    { city: returnLeg.destinationCity, location: returnLeg.destinationLocation },
  ];
  const returnEstimate = await estimateRouteDistance(returnWaypoints).catch(() => null);
  if (!returnEstimate) return null;

  return outboundEstimate.distanceKm + returnEstimate.distanceKm;
}
