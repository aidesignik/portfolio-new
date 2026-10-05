import { geocodeAddress } from "./geocoding";
import { osrmRouteDistanceKm, haversineRouteDistanceKm, haversineKm, type Coordinates } from "./distance";
import { formatLocation, type CityLocation } from "./location";
import { resolveReturnLeg } from "./rideReturnLeg";

// A generic/ambiguous location name (e.g. "Hotel") can geocode to an
// unrelated place of the same name elsewhere in the (Nominatim-scoped)
// region rather than the hotel actually in this city — if the "specific"
// result lands implausibly far from the city itself, that's a stronger
// signal of a bad match than a routing estimate, so fall back to the
// city-level coordinate instead of trusting a wildly wrong "precise" one.
const MAX_LOCATION_DRIFT_KM = 60;

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
 *
 * When a specific result IS found, it's cross-checked against the city's
 * own coordinate: a generic location name (e.g. "Hotel") can match an
 * unrelated place with the same name instead of failing outright, so a
 * "successful" geocode isn't on its own proof the match is correct.
 */
async function geocodeWaypoint(waypoint: CityLocation): Promise<Coordinates | null> {
  if (!waypoint.location) return geocodeAddress(waypoint.city);

  const specific = await geocodeAddress(formatLocation(waypoint));
  const cityOnly = await geocodeAddress(waypoint.city);
  if (!specific) return cityOnly;
  if (!cityOnly) return specific;

  const driftKm = haversineKm(specific, cityOnly);
  return driftKm > MAX_LOCATION_DRIFT_KM ? cityOnly : specific;
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
    if (!coords) {
      // The live distance preview fails silently in the UI by design (it's
      // a non-critical nicety) — log server-side so a geocoding failure is
      // at least visible to whoever's running the dev server.
      console.warn(`[tripDistance] couldn't geocode "${formatLocation(waypoint)}" (or "${waypoint.city}")`);
      return null;
    }
    coordinates.push(coords);
  }

  try {
    const result = await osrmRouteDistanceKm(coordinates);
    return { distanceKm: result.distanceKm, provider: "osrm", coordinates };
  } catch (err) {
    console.warn("[tripDistance] OSRM routing failed, falling back to haversine estimate:", err);
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

export interface TripDistanceResult {
  totalKm: number;
  outboundKm: number;
  // null for a one-way trip — there's no return leg to report.
  returnKm: number | null;
}

/**
 * Total trip distance for the live "how many km is this?" preview shared
 * by the carrier and client-facing distance endpoints — the outbound leg
 * alone for a one-way trip, outbound + return for a round trip. The return
 * leg is resolved the same way resolveReturnLeg() does for display/storage:
 * endpoints default to the outbound swapped, no stops assumed unless given.
 * Returns both legs individually (not just the summed total) so a caller
 * can show an outbound/return breakdown without computing anything itself —
 * this was always calculated internally, just not previously returned.
 * Returns null if any waypoint can't be geocoded.
 */
export async function estimateTripDistance(input: TripDistanceInput): Promise<TripDistanceResult | null> {
  const outboundWaypoints = [
    { city: input.pickupCity, location: input.pickupLocation },
    ...input.stops,
    { city: input.destinationCity, location: input.destinationLocation },
  ];
  const outboundEstimate = await estimateRouteDistance(outboundWaypoints).catch(() => null);
  if (!outboundEstimate) return null;
  if (!input.isRoundTrip) {
    return { totalKm: outboundEstimate.distanceKm, outboundKm: outboundEstimate.distanceKm, returnKm: null };
  }

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

  return {
    totalKm: outboundEstimate.distanceKm + returnEstimate.distanceKm,
    outboundKm: outboundEstimate.distanceKm,
    returnKm: returnEstimate.distanceKm,
  };
}
