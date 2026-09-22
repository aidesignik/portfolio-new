"use client";

import type { ReactNode } from "react";

// Wraps a cell that holds its own interactive control (row-actions menu,
// etc.) so clicking it doesn't also trigger the parent ClickableRow's
// navigation. A plain onClick prop can't be attached to a DOM element from
// a Server Component, hence this tiny client wrapper.
export function StopClickPropagation({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div onClick={(e) => e.stopPropagation()} className={className}>
      {children}
    </div>
  );
}
