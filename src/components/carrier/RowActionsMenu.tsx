"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export function RowActionsMenu({ editHref, deleteUrl }: { editHref: string; deleteUrl: string }) {
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
        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        aria-label={t("actions")}
      >
        ⋮
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-32 rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
          <Link
            href={editHref}
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            {t("edit")}
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="block w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-zinc-50 disabled:opacity-50"
          >
            {t("delete")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
