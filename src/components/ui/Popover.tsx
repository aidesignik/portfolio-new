"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

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
export function usePopover({
  openDelayMs = 300,
  closeGraceMs = 100,
  // Checked right before an open actually happens (hover-delay elapsed, or
  // focus) — lets the caller gate opening on something other than "is this
  // trigger hovered/focused" (e.g. "is the trigger currently narrow enough
  // to need this"), without the hook needing to know why.
  enabled,
}: {
  openDelayMs?: number;
  closeGraceMs?: number;
  enabled?: () => boolean;
} = {}) {
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

  function canOpen() {
    if (touch) return false;
    return enabled ? enabled() : true;
  }

  function scheduleOpen() {
    if (!canOpen()) return;
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpen(true), openDelayMs);
  }
  function scheduleClose() {
    clearTimers();
    if (closeGraceMs <= 0) {
      setOpen(false);
      return;
    }
    closeTimer.current = window.setTimeout(() => setOpen(false), closeGraceMs);
  }
  function openNow() {
    if (!canOpen()) return;
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

type Placement = "side" | "top";

// Floating panel, portaled to <body>, positioned relative to triggerRef.
// Re-measures on open, scroll (capture, so it follows the calendar's
// internal scroll container) and resize. Always clamped inside the
// viewport.
//
// placement="side": right-of + top-aligned by default, flips to left-of,
// then below, when there's no room.
// placement="top": centered above by default (with a small arrow pointing
// at the trigger), flips below when there's no room above.
export function PopoverPanel({
  open,
  triggerRef,
  panelRef,
  hoverProps,
  width,
  placement = "side",
  interactive = true,
  className,
  children,
}: {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  hoverProps?: { onMouseEnter: () => void; onMouseLeave: () => void };
  width?: number;
  placement?: Placement;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [coords, setCoords] = useState<{ top: number; left: number; arrowLeft?: number; flipped?: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }
    function place() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelW = width ?? panelRef.current?.offsetWidth ?? 200;
      const panelH = panelRef.current?.offsetHeight ?? 40;

      let left: number;
      let top: number;
      let arrowLeft: number | undefined;
      let flipped = false;

      if (placement === "top") {
        const centerX = rect.left + rect.width / 2;
        left = centerX - panelW / 2;
        top = rect.top - TRIGGER_GAP - panelH;
        if (top < VIEWPORT_MARGIN) {
          top = rect.bottom + TRIGGER_GAP;
          flipped = true;
        }
        const clampedLeft = Math.min(Math.max(left, VIEWPORT_MARGIN), window.innerWidth - VIEWPORT_MARGIN - panelW);
        arrowLeft = centerX - clampedLeft;
        left = clampedLeft;
      } else {
        left = rect.right + TRIGGER_GAP;
        top = rect.top;
        const fitsRight = left + panelW <= window.innerWidth - VIEWPORT_MARGIN;
        if (!fitsRight) {
          const leftOfLeft = rect.left - TRIGGER_GAP - panelW;
          const fitsLeft = leftOfLeft >= VIEWPORT_MARGIN;
          if (fitsLeft) {
            left = leftOfLeft;
          } else {
            left = Math.min(rect.left, window.innerWidth - VIEWPORT_MARGIN - panelW);
            top = rect.bottom + TRIGGER_GAP;
          }
        }
        left = Math.min(Math.max(left, VIEWPORT_MARGIN), window.innerWidth - VIEWPORT_MARGIN - panelW);
      }

      top = Math.min(Math.max(top, VIEWPORT_MARGIN), window.innerHeight - VIEWPORT_MARGIN - panelH);
      setCoords({ top, left, arrowLeft, flipped });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, triggerRef, panelRef, width, placement]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      role="tooltip"
      onMouseEnter={interactive ? hoverProps?.onMouseEnter : undefined}
      onMouseLeave={interactive ? hoverProps?.onMouseLeave : undefined}
      style={{
        position: "fixed",
        top: coords?.top ?? -9999,
        left: coords?.left ?? -9999,
        width,
        visibility: coords ? "visible" : "hidden",
        pointerEvents: interactive ? "auto" : "none",
      }}
      className={className ?? "z-[70] rounded-[12px] bg-white p-[14px] shadow-[0_2px_4px_rgba(20,20,19,.06),0_10px_28px_rgba(20,20,19,.14)]"}
    >
      {children}
      {placement === "top" && coords?.arrowLeft !== undefined ? (
        <span
          aria-hidden
          className="absolute h-[7px] w-[7px] bg-inherit"
          style={{
            left: coords.arrowLeft - 3.5,
            ...(coords.flipped
              ? { top: -3.5, transform: "rotate(45deg)" }
              : { bottom: -3.5, transform: "rotate(45deg)" }),
          }}
        />
      ) : null}
    </div>,
    document.body,
  );
}
