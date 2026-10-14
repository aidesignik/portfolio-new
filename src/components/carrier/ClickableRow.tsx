"use client";

import type { CSSProperties, ReactNode } from "react";

// A table row that's clickable in full (opens the edit side panel) with at
// most one nested interactive element (the row-actions "···" menu) — cells
// that hold their own controls stop propagation so they don't also trigger
// the row's own click. `selected` keeps the row's hover fill on at rest
// while its side panel is open, so it stays visible which row the panel
// belongs to instead of only flashing on hover.
export function ClickableRow({
  onClick,
  className = "",
  style,
  selected = false,
  children,
}: {
  onClick: () => void;
  className?: string;
  style?: CSSProperties;
  selected?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="row"
      onClick={onClick}
      className={`cursor-pointer transition-colors duration-[.12s] ease-out hover:bg-[var(--bg-subtle)] ${
        selected ? "bg-[var(--bg-subtle)]" : ""
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
