"use client";

import { useTranslations } from "next-intl";
import { Plus, ChevronDown } from "lucide-react";

// Primary action on both Calendar and Bookings — same "New ride" copy and
// split-button shape (plus + label, chevron segment) on every screen. The
// chevron segment has no distinct menu of its own yet, so it shares the
// main segment's click handler rather than opening an empty dropdown.
export function NewRideSplitButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("carrier.calendar");

  return (
    <div className="flex h-9 shrink-0 items-stretch overflow-hidden rounded-[9px] bg-[var(--action-bg)] text-white">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-[6px] whitespace-nowrap px-[14px] text-[14px] font-medium transition-colors duration-[.12s] ease-out hover:bg-[var(--action-bg-hover)]"
      >
        <Plus size={16} strokeWidth={1.9} />
        {t("newRide")}
      </button>
      <button
        type="button"
        onClick={onClick}
        aria-label={t("newRide")}
        className="flex items-center border-l border-[rgba(255,255,255,.28)] px-[10px] transition-colors duration-[.12s] ease-out hover:bg-[var(--action-bg-hover)]"
      >
        <ChevronDown size={14} strokeWidth={1.9} />
      </button>
    </div>
  );
}
