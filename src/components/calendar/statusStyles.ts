import type { RideStatus } from "./types";

// One accent colour per ride status — used for the card's 2-part top bar
// and the toolbar legend dot. Ride cards are otherwise uniform (white,
// hairline border, card shadow) regardless of status; nothing "shouts".
export const RIDE_STATUS_ACCENT: Record<RideStatus, string> = {
  PENDING: "#F97316",
  CONFIRMED: "#2563EB",
  COMPLETED: "#16A34A",
  CANCELLED: "#A1A1AA",
};
