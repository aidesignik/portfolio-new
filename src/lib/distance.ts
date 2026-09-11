export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
  provider: string;
}

const EARTH_RADIUS_KM = 6371;
// Straight-line distance underestimates real road distance; this factor is a
// rough correction used only as a fallback when the real routing provider
// (OSRM) is unreachable.
const ROAD_CURVATURE_FACTOR = 1.3;
const AVERAGE_SPEED_KMH = 60;
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

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
 * Sum of straight-line legs between consecutive points, road-corrected. No
 * external calls — used only as a fallback when OSRM is unreachable.
 */
export function haversineRouteDistanceKm(points: Coordinates[]): DistanceResult {
  let straightLineKm = 0;
  for (let i = 0; i < points.length - 1; i++) {
    straightLineKm += haversineKm(points[i], points[i + 1]);
  }
  const distanceKm = Math.round(straightLineKm * ROAD_CURVATURE_FACTOR * 10) / 10;
  const durationMinutes = Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);
  return { distanceKm, durationMinutes, provider: "stub-haversine" };
}

/**
 * Free, keyless real-road routing via the public OSRM demo server, following
 * an ordered list of waypoints (pickup, any stops, destination) as a single
 * route. Good enough for this MVP's traffic; not backed by an SLA, so
 * callers should fall back to haversineRouteDistanceKm if this throws.
 */
export async function osrmRouteDistanceKm(points: Coordinates[]): Promise<DistanceResult> {
  if (points.length < 2) {
    throw new Error("At least 2 points are required to compute a route");
  }

  const path = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const res = await fetch(`${OSRM_URL}/${path}?overview=false`);
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
