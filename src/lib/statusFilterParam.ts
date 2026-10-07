// Shared URL (de)serialization for the Status MultiSelectFilter, used
// identically by Calendar/Rezervacije/Vozni park/Vozači — the query
// param is always lowercase, comma-separated (?status=pending,confirmed),
// while every caller's own option values stay in their native case
// (RideStatus is uppercase, vehicle status is uppercase, etc).
export function parseStatusParam(raw: string | null | undefined, validValues: string[]): string[] {
  if (!raw) return [];
  const valid = new Set(validValues);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(",")) {
    const value = part.trim().toUpperCase();
    if (valid.has(value) && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}

export function serializeStatusParam(values: string[]): string {
  return values.map((v) => v.toLowerCase()).join(",");
}
