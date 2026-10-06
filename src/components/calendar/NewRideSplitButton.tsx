"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

// Primary action on both Calendar and Bookings — same "New ride" copy and
// shape on every screen.
export function NewRideSplitButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("carrier.calendar");

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 shrink-0 items-center gap-[6px] whitespace-nowrap rounded-[9px] bg-[var(--action-bg)] px-[14px] text-[14px] font-medium text-white transition-colors duration-[.12s] ease-out hover:bg-[var(--action-bg-hover)]"
    >
      <Plus size={16} strokeWidth={1.9} />
      {t("newRide")}
    </button>
  );
}
