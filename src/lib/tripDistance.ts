import { geocodeAddress } from "./geocoding";
import { distanceProvider, osrmDistanceProvider } from "./distance";

export interface TripDistanceEstimate {
  distanceKm: number;
  provider: "osrm" | "stub-haversine";
}

/**
 * Geocodes both addresses, then tries the real OSRM road-distance provider,
 * falling back to the haversine stub if OSRM is unreachable or the route
 * can't be computed (e.g. no drivable path found). Returns null only when
 * one of the addresses can't be geocoded at all — callers should then fall
 * back to manual distance entry.
 */
export async function estimateTripDistance(
  pickupAddress: string,
  destinationAddress: string,
): Promise<TripDistanceEstimate | null> {
  const [origin, destination] = await Promise.all([
    geocodeAddress(pickupAddress),
    geocodeAddress(destinationAddress),
  ]);

  if (!origin || !destination) return null;

  try {
    const result = await osrmDistanceProvider.calculate(origin, destination);
    return { distanceKm: result.distanceKm, provider: "osrm" };
  } catch {
    const result = await distanceProvider.calculate(origin, destination);
    return { distanceKm: result.distanceKm, provider: "stub-haversine" };
  }
}
