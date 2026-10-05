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
      style={{ background: "var(--accent)", boxShadow: "var(--shadow-new-ride)" }}
      className="flex h-11 shrink-0 items-center gap-[6px] whitespace-nowrap rounded-[12px] px-[16px] text-[15px] font-semibold text-white transition-[filter,transform] duration-[.12s] ease-out hover:brightness-[1.06] active:translate-y-[1px]"
    >
      <Plus size={17} strokeWidth={2} />
      {t("newRide")}
    </button>
  );
}
