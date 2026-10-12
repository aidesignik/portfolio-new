"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

// A small centered confirmation modal for a destructive action that needs
// an explicit "are you sure" step with its own title/body copy and custom
// button labels — what a plain native confirm() can't offer. Render it as
// a sibling of the SidePanel it was opened from (not nested inside it): a
// SidePanel is translated via a CSS `transform`, which makes any `fixed`
// descendant position itself relative to the panel instead of the
// viewport, so this needs to sit outside that subtree to truly center on
// screen and sit above everything else.
export function ConfirmDialog({
  title,
  body,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  confirming,
}: {
  title: string;
  body?: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirming?: boolean;
}) {
  useEffect(() => {
    // Capture phase + stopPropagation: a SidePanel also closes itself on a
    // bubble-phase Escape listener on `document`. Without this, Escape
    // here would both dismiss this dialog AND close the panel behind it,
    // since that listener was registered first and would otherwise still
    // run. Capturing on `document` fires before any bubble-phase listener
    // regardless of registration order.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onCancel();
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-[380px] rounded-[14px] bg-[var(--bg-panel)] p-5 shadow-[var(--shadow-panel)]"
      >
        <h2 id="confirm-dialog-title" className="text-[16px] font-semibold text-[var(--ink-primary)]">
          {title}
        </h2>
        {body ? <p className="mt-[6px] text-[13.5px] text-[var(--ink-secondary)]">{body}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" compact onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" compact disabled={confirming} onClick={onConfirm}>
            {confirming ? "…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
