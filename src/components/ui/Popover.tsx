"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

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
  // Starts below the trigger and flips above it when there isn't enough
  // room below in the viewport (and there's more room above) — measured
  // after the first paint since it depends on the popover's own rendered
  // height, which varies with its content (e.g. the sent/error states).
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");

  useLayoutEffect(() => {
    const el = ref.current;
    const anchor = el?.offsetParent as HTMLElement | null;
    if (!el || !anchor) return;
    const anchorRect = anchor.getBoundingClientRect();
    const margin = 8;
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    setPlacement(el.offsetHeight + margin > spaceBelow && spaceAbove > spaceBelow ? "top" : "bottom");
  }, []);

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
      className={`absolute z-[70] overflow-hidden rounded-[14px] bg-[var(--bg-panel)] shadow-[var(--shadow-panel)] ${
        placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
      } ${align === "end" ? "right-0" : "left-0"}`}
    >
      {children}
    </div>
  );
}
