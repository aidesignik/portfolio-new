// Single source of truth for driver identity colors. A driver's color is
// assigned once (least-used palette entry) and stored on the Driver row —
// never derived from the name or re-hashed at render time, so renaming a
// driver never changes how they look. See DriverAvatar for where this gets
// consumed, and assignLeastUsedDriverColor for the assignment rule.
export const DRIVER_COLORS = {
  lavender: { bg: "#ECE3FC", fg: "#5B3BA8", accent: "#8B6FE0" },
  periwinkle: { bg: "#DFE7FC", fg: "#2F4FA8", accent: "#5B7FE6" },
  sky: { bg: "#DAEEF8", fg: "#1F5E80", accent: "#4AA3CF" },
  teal: { bg: "#D6F0EE", fg: "#1D625E", accent: "#45AFA6" },
  mint: { bg: "#DCF3E4", fg: "#23633F", accent: "#4CB27A" },
  sage: { bg: "#E8EFD6", fg: "#4D5E20", accent: "#8FA548" },
  butter: { bg: "#FAEFCF", fg: "#7A5410", accent: "#E0B243" },
  peach: { bg: "#FCE4D4", fg: "#8A4318", accent: "#EE9563" },
  rose: { bg: "#FADDE2", fg: "#9A2E44", accent: "#E7798D" },
  orchid: { bg: "#F6DFF1", fg: "#8A2F79", accent: "#D27BC0" },
} as const;

export type DriverColorKey = keyof typeof DRIVER_COLORS;

// Assignment (least-used, ties -> palette order) walks this array in
// order, so it also doubles as the canonical display order for the color
// picker.
export const DRIVER_COLOR_KEYS = Object.keys(DRIVER_COLORS) as DriverColorKey[];

export function isDriverColorKey(value: unknown): value is DriverColorKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(DRIVER_COLORS, value);
}

// Defensive fallback only — used when a driver's stored avatarColor is
// missing or invalid, never as the primary assignment mechanism (that's
// assignLeastUsedDriverColor, run once at creation/backfill).
export function hashDriverColor(key: string): DriverColorKey {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return DRIVER_COLOR_KEYS[hash % DRIVER_COLOR_KEYS.length];
}

export function resolveDriverColor(key: string | null | undefined, fallbackSeed: string): DriverColorKey {
  if (isDriverColorKey(key)) return key;
  return hashDriverColor(fallbackSeed);
}
