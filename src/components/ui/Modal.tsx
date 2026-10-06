"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

// A small centered dialog for a single focused task (confirm, short form)
// — unlike SidePanel's edge-anchored sheet for a bigger form that wants
// the page behind it to stay live, this dims and blocks the page behind
// it, closes on backdrop click or Escape, and is meant to be brief.
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex w-full max-w-[420px] flex-col overflow-hidden rounded-[14px] bg-[var(--bg-panel)] shadow-[var(--shadow-panel)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-hairline)] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[var(--ink-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[var(--ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
          >
            <X size={16} strokeWidth={1.9} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
