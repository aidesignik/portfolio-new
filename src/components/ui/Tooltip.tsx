"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// A small floating label for an icon-only control that already carries its
// own aria-label (this is purely a sighted-user hint, not what makes the
// control accessible) — shown on hover or keyboard focus after a short
// delay so it doesn't flash on every passing mouse movement.
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function show() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), 300);
  }
  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  }

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {open ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-[80] mb-[6px] -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[#18181B] px-2 py-1 text-[12px] font-medium text-white shadow-[var(--shadow-panel)]"
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
