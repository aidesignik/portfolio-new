export const STOPS_INCLUDE = { orderBy: [{ leg: "asc" as const }, { order: "asc" as const }] };

// Ride.stops holds both legs (tagged OUTBOUND/RETURN) — split back into the
// two flat arrays the UI expects.
export function splitLegs<T extends { stops: { leg: "OUTBOUND" | "RETURN"; city: string; location: string }[] }>(
  ride: T,
) {
  const { stops, ...rest } = ride;
  return {
    ...rest,
    stops: stops.filter((s) => s.leg === "OUTBOUND").map(({ city, location }) => ({ city, location })),
    returnStops: stops.filter((s) => s.leg === "RETURN").map(({ city, location }) => ({ city, location })),
  };
}
