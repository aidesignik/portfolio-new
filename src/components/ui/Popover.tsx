"use client";

import { useEffect, useRef, type ReactNode } from "react";

// An anchored floating panel for a short, focused task — unlike Modal, it
// doesn't dim or block the page behind it, just rests near its trigger
// with a strong shadow for legibility against whatever's underneath.
// Render it inside a `relative` wrapper around the trigger that opens it
// (this positions itself `absolute` within that wrapper); the caller owns
// the open/closed state. Closes on click-outside or Escape, same as the
// app's other anchored panels (FilterDropdown, RowActionsMenu).
export function Popover({
  onClose,
  align = "end",
  width = 320,
  children,
}: {
  onClose: () => void;
  align?: "start" | "end";
  width?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ width }}
      className={`absolute top-full z-[70] mt-2 overflow-hidden rounded-[14px] bg-[var(--bg-panel)] shadow-[var(--shadow-panel)] ${
        align === "end" ? "right-0" : "left-0"
      }`}
    >
      {children}
    </div>
  );
}
