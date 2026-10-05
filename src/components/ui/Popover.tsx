"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

const OPEN_DELAY_MS = 300;
const CLOSE_GRACE_MS = 100;
const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 8;

export interface PopoverTriggerHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

// Hover (delayed open, grace-period close) + focus/blur/Escape open-state
// machine, decoupled from rendering so the caller can attach triggerProps
// to whatever element should act as the trigger (e.g. an existing button)
// without needing ref-forwarding tricks.
export function usePopover() {
  const [open, setOpen] = useState(false);
  const [touch, setTouch] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    // One-time client-only read of the device's hover capability — can't
    // be known during the initial (server) render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  function clearTimers() {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }

  function scheduleOpen() {
    if (touch) return;
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  }
  function scheduleClose() {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_GRACE_MS);
  }
  function openNow() {
    if (touch) return;
    clearTimers();
    setOpen(true);
  }
  function closeNow() {
    clearTimers();
    setOpen(false);
  }

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        clearTimers();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const triggerProps: PopoverTriggerHandlers = {
    onMouseEnter: scheduleOpen,
    onMouseLeave: scheduleClose,
    onFocus: openNow,
    onBlur: closeNow,
  };
  const panelHoverProps = {
    onMouseEnter: clearTimers,
    onMouseLeave: scheduleClose,
  };

  return { open, triggerRef, panelRef, triggerProps, panelHoverProps };
}

// Floating panel, portaled to <body>, positioned relative to triggerRef:
// right-of + top-aligned by default, flips to left-of, then below, and is
// always clamped inside the viewport. Re-measures on open, scroll (capture,
// so it follows the calendar's internal scroll container) and resize.
export function PopoverPanel({
  open,
  triggerRef,
  panelRef,
  hoverProps,
  width = 240,
  children,
}: {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  hoverProps: { onMouseEnter: () => void; onMouseLeave: () => void };
  width?: number;
  children: ReactNode;
}) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }
    function place() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelH = panelRef.current?.offsetHeight ?? 180;

      let left = rect.right + TRIGGER_GAP;
      let top = rect.top;

      const fitsRight = left + width <= window.innerWidth - VIEWPORT_MARGIN;
      if (!fitsRight) {
        const leftOfLeft = rect.left - TRIGGER_GAP - width;
        const fitsLeft = leftOfLeft >= VIEWPORT_MARGIN;
        if (fitsLeft) {
          left = leftOfLeft;
        } else {
          // Neither side fits — drop below the card instead.
          left = Math.min(rect.left, window.innerWidth - VIEWPORT_MARGIN - width);
          top = rect.bottom + TRIGGER_GAP;
        }
      }

      top = Math.min(Math.max(top, VIEWPORT_MARGIN), window.innerHeight - VIEWPORT_MARGIN - panelH);
      left = Math.min(Math.max(left, VIEWPORT_MARGIN), window.innerWidth - VIEWPORT_MARGIN - width);
      setCoords({ top, left });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, triggerRef, panelRef, width]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      role="tooltip"
      onMouseEnter={hoverProps.onMouseEnter}
      onMouseLeave={hoverProps.onMouseLeave}
      style={{
        position: "fixed",
        top: coords?.top ?? -9999,
        left: coords?.left ?? -9999,
        width,
        visibility: coords ? "visible" : "hidden",
      }}
      className="z-[70] rounded-[12px] bg-white p-[14px] shadow-[0_2px_4px_rgba(20,20,19,.06),0_10px_28px_rgba(20,20,19,.14)]"
    >
      {children}
    </div>,
    document.body,
  );
}
