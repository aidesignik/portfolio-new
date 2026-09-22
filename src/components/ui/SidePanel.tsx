"use client";

import { useEffect, useState, type ReactNode } from "react";

// A right-edge slide-in panel that overlays the page without dimming it —
// unlike a centered modal, whatever's behind (the calendar, specifically)
// stays fully visible, legible and interactive while the panel is open.
// Deliberately no backdrop/scrim and no click-outside-to-close: a full-page
// click-catcher would block interacting with the page behind it, and the
// calendar needs to stay live (e.g. scrolling to a date picked in a form)
// while a panel is open. Close via the panel's own close control or Escape.
export function SidePanel({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  // Mounted one tick after the initial (off-screen) paint, then flipped to
  // its resting position — a plain CSS transition needs the "closed" state
  // to actually paint before switching to "open" for the slide-in to show.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-[408px] flex-col rounded-l-[18px] bg-[var(--bg-panel)] shadow-[var(--shadow-panel)] transition-transform duration-[.22s] ease-[cubic-bezier(.32,.72,0,1)] ${
        entered ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {children}
    </div>
  );
}
