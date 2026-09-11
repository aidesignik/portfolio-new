export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
  provider: string;
}

export interface DistanceProvider {
  calculate(origin: Coordinates, destination: Coordinates): Promise<DistanceResult>;
}

const EARTH_RADIUS_KM = 6371;
// Straight-line distance underestimates real road distance; this factor is a
// rough correction until a real routing provider is wired in behind this interface.
const ROAD_CURVATURE_FACTOR = 1.3;
const AVERAGE_SPEED_KMH = 60;

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineKm(origin: Coordinates, destination: Coordinates) {
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * No external API calls. Swap for a real routing provider (Google Maps,
 * OSRM, ...) later by implementing the same interface.
 */
export class StubDistanceProvider implements DistanceProvider {
  async calculate(
    origin: Coordinates,
    destination: Coordinates,
  ): Promise<DistanceResult> {
    const straightLineKm = haversineKm(origin, destination);
    const distanceKm = Math.round(straightLineKm * ROAD_CURVATURE_FACTOR * 10) / 10;
    const durationMinutes = Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);
    return { distanceKm, durationMinutes, provider: "stub-haversine" };
  }
}

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * Free, keyless real-road routing via the public OSRM demo server. Good
 * enough for this MVP's traffic; not backed by an SLA, so callers should
 * fall back to StubDistanceProvider if a request fails.
 */
export class OsrmDistanceProvider implements DistanceProvider {
  async calculate(
    origin: Coordinates,
    destination: Coordinates,
  ): Promise<DistanceResult> {
    const url = `${OSRM_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`OSRM request failed with status ${res.status}`);
    }

    const data = (await res.json()) as {
      code: string;
      routes?: Array<{ distance: number; duration: number }>;
    };
    const route = data.routes?.[0];
    if (data.code !== "Ok" || !route) {
      throw new Error("OSRM returned no route");
    }

    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMinutes: Math.round(route.duration / 60),
      provider: "osrm",
    };
  }
}

export const distanceProvider: DistanceProvider = new StubDistanceProvider();
export const osrmDistanceProvider: DistanceProvider = new OsrmDistanceProvider();
