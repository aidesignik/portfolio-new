import type { RideStatus } from "./types";

// One accent colour per ride status — used for the toolbar legend dot.
export const RIDE_STATUS_ACCENT: Record<RideStatus, string> = {
  PENDING: "#F97316",
  CONFIRMED: "#2563EB",
  COMPLETED: "#16A34A",
  CANCELLED: "#A1A1AA",
};

// Ride card fill per status — the card's whole background carries its
// status (see --status-*-bg tokens in globals.css) instead of an accent bar.
export const RIDE_STATUS_BG: Record<RideStatus, string> = {
  PENDING: "var(--status-pending-bg)",
  CONFIRMED: "var(--status-confirmed-bg)",
  COMPLETED: "var(--status-completed-bg)",
  CANCELLED: "var(--status-cancelled-bg)",
};

// Saturated pairing of RIDE_STATUS_BG (see --status-*-dot tokens in
// globals.css) — for small elements where the soft fill reads too faint,
// e.g. the toolbar legend dots.
export const RIDE_STATUS_DOT: Record<RideStatus, string> = {
  PENDING: "var(--status-pending-dot)",
  CONFIRMED: "var(--status-confirmed-dot)",
  COMPLETED: "var(--status-completed-dot)",
  CANCELLED: "var(--status-cancelled-dot)",
};

// Same values as RIDE_STATUS_DOT, but as plain hex rather than a var()
// reference — for call sites that need to alpha-blend the color in JS
// (e.g. a booking card's inset ring/capacity-bar track at a fixed opacity)
// rather than just set it as a solid background/text color.
export const RIDE_STATUS_HEX: Record<RideStatus, string> = {
  PENDING: "#D64553",
  CONFIRMED: "#3B63E0",
  COMPLETED: "#2F8A57",
  CANCELLED: "#A3A39C",
};

// Lighter of the two status-tinted text shades (see --status-*-text-1 in
// globals.css) — for a caption-level line on a status-tinted surface, e.g.
// a booking card's client name under the route.
export const RIDE_STATUS_TEXT_1: Record<RideStatus, string> = {
  PENDING: "var(--status-pending-text-1)",
  CONFIRMED: "var(--status-confirmed-text-1)",
  COMPLETED: "var(--status-completed-text-1)",
  CANCELLED: "var(--status-cancelled-text-1)",
};

// Darker of the two status-tinted text shades (see --status-*-text-2 in
// globals.css) — for smaller/denser text on a status-tinted surface, e.g. a
// booking card's bottom-row time/capacity line, or a status pill's label.
export const RIDE_STATUS_TEXT_2: Record<RideStatus, string> = {
  PENDING: "var(--status-pending-text-2)",
  CONFIRMED: "var(--status-confirmed-text-2)",
  COMPLETED: "var(--status-completed-text-2)",
  CANCELLED: "var(--status-cancelled-text-2)",
};
