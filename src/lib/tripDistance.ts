import { geocodeAddress } from "./geocoding";
import { osrmRouteDistanceKm, haversineRouteDistanceKm, type Coordinates } from "./distance";
import { formatLocation, type CityLocation } from "./location";

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
