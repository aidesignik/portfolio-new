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
