"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MoreVertical } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export function RowActionsMenu({ onEdit, deleteUrl }: { onEdit: () => void; deleteUrl: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function onDelete() {
    if (!confirm(`${t("delete")}?`)) return;
    setDeleting(true);
    await fetch(deleteUrl, { method: "DELETE" });
    setDeleting(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="justify-self-end rounded-[9px] p-2 text-[var(--ink-disabled)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
        aria-label={t("actions")}
      >
        <MoreVertical size={17} strokeWidth={1.9} />
      </button>
      {open ? (
        <div className="absolute right-0 z-[60] mt-1 w-36 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-panel)] py-1 shadow-[var(--shadow-card)]">
          <button
            type="button"
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
            onClick={onDelete}
            disabled={deleting}
            className="block h-9 w-full px-3 text-left text-[14px] leading-9 text-[#7F1D1D] hover:bg-[var(--border-soft)] disabled:opacity-50"
          >
            {t("delete")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
