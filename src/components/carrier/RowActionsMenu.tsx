"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MoreVertical } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function RowActionsMenu({ onEdit, deleteUrl }: { onEdit: () => void; deleteUrl: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function closeAndRefocus() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeAndRefocus();
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function onDelete() {
    setDeleting(true);
    await fetch(deleteUrl, { method: "DELETE" });
    setDeleting(false);
    setConfirmingDelete(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-[9px] p-2 text-[var(--ink-disabled)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
        aria-label={t("actions")}
      >
        <MoreVertical size={16} strokeWidth={1.9} aria-hidden="true" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-[60] mt-1 w-36 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-panel)] py-1 shadow-[var(--shadow-card)]">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="block h-9 w-full px-3 text-left text-[14px] leading-9 text-[var(--ink-2)] hover:bg-[var(--border-soft)]"
          >
            {t("edit")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmingDelete(true);
            }}
            disabled={deleting}
            className="block h-9 w-full px-3 text-left text-[14px] leading-9 text-[var(--ink-destructive)] hover:bg-[var(--border-soft)] disabled:opacity-50"
          >
            {t("delete")}
          </button>
        </div>
      ) : null}
      {confirmingDelete ? (
        <ConfirmDialog
          title={t("deleteConfirmTitle")}
          body={t("deleteConfirmBody")}
          cancelLabel={t("cancel")}
          confirmLabel={t("delete")}
          confirming={deleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={onDelete}
        />
      ) : null}
    </div>
  );
}
