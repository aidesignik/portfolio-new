import type { CSSProperties } from "react";
import type { RideStatus } from "./types";

// Ride-block styling by status. Colors drawn from this app's existing
// palette (zinc/amber/emerald/red via the Badge/Button components) rather
// than introducing new ones — "solid accent" here means this app's own
// accent (zinc-900, the same color primary buttons use), not blue.
export const RIDE_STATUS_STYLES: Record<RideStatus, { block: string; label: string }> = {
  PENDING: {
    block: "border border-dashed border-amber-400 bg-amber-50 text-amber-800",
    label: "border border-dashed border-amber-400 bg-amber-50",
  },
  CONFIRMED: {
    block: "border border-zinc-900 bg-zinc-900 text-white",
    label: "bg-zinc-900",
  },
  COMPLETED: {
    block: "border border-emerald-200 bg-emerald-50 text-emerald-800",
    label: "bg-emerald-50 border border-emerald-200",
  },
  CANCELLED: {
    block: "border border-dashed border-zinc-300 bg-zinc-100 text-zinc-500 line-through",
    label: "bg-zinc-100 border border-dashed border-zinc-300",
  },
};

// Diagonal-stripe pattern for blocked (maintenance/day off/vacation) cells
// — visually distinct from any ride block so "unavailable" is never
// mistaken for "has a ride."
export const BLOCK_PATTERN_STYLE: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgb(228 228 231) 0, rgb(228 228 231) 6px, rgb(244 244 245) 6px, rgb(244 244 245) 12px)",
};
