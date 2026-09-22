import type { CSSProperties } from "react";
import type { RideStatus } from "./types";

// Ride-card styling by status, per the Atlas design system's accent-color
// set: a blue top-of-card accent bar for a normal confirmed/scheduled ride,
// green for completed, and a distinct dashed amber treatment (no shadow) for
// pending/unconfirmed rides so they read as "not locked in yet" at a glance.
// Cancelled rides stay flat and muted.
export const RIDE_STATUS_STYLES: Record<
  RideStatus,
  { card: string; accent: string; dashed: boolean; text: string; label: string }
> = {
  PENDING: {
    card: "border-[1.5px] border-dashed border-[#F97316] bg-[#FFF7ED]",
    accent: "#F97316",
    dashed: true,
    text: "text-[var(--ink-2)]",
    label: "bg-[#FFF7ED] border border-dashed border-[#F97316]",
  },
  CONFIRMED: {
    card: "border border-[var(--border-hairline)] bg-[var(--bg-panel)] shadow-[var(--shadow-card)]",
    accent: "#2563EB",
    dashed: false,
    text: "text-[var(--ink-primary)]",
    label: "bg-[#2563EB]",
  },
  COMPLETED: {
    card: "border border-[var(--border-hairline)] bg-[var(--bg-panel)] shadow-[var(--shadow-card)]",
    accent: "#16A34A",
    dashed: false,
    text: "text-[var(--ink-primary)]",
    label: "bg-[#16A34A]",
  },
  CANCELLED: {
    card: "border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] opacity-70",
    accent: "#A9A9B2",
    dashed: true,
    text: "text-[var(--ink-disabled)] line-through",
    label: "bg-[var(--border-strong)] border border-dashed border-[var(--border-strong)]",
  },
};

// Diagonal-stripe pattern for blocked (maintenance/day off/vacation) cells
// — visually distinct from any ride block so "unavailable" is never
// mistaken for "has a ride."
export const BLOCK_PATTERN_STYLE: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgb(228 228 231) 0, rgb(228 228 231) 6px, rgb(244 244 245) 6px, rgb(244 244 245) 12px)",
};
