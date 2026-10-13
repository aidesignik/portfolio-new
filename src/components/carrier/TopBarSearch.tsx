"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

// Which section's own placeholder copy to show, keyed by the sidebar route
// it lives under — matches the entity each section actually lists (Fleet
// lists vehicles, Bookings lists rides, etc.), not the nav label itself.
const SECTION_PLACEHOLDER_KEY: { href: string; key: string }[] = [
  { href: "/carrier/dashboard", key: "searchRides" },
  { href: "/carrier/requests", key: "searchRequests" },
  { href: "/carrier/bookings", key: "searchRides" },
  { href: "/carrier/fleet", key: "searchVehicles" },
  { href: "/carrier/drivers", key: "searchDrivers" },
];

export function TopBarSearch() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const match = SECTION_PLACEHOLDER_KEY.find(
    (section) => pathname === section.href || pathname.startsWith(`${section.href}/`),
  );
  const placeholder = match ? t(match.key) : t("search");

  return (
    <div className="relative w-full max-w-[420px]">
      <Search
        size={16}
        strokeWidth={1.9}
        color="#A1A1AA"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
      />
      <input
        type="search"
        placeholder={placeholder}
        className="h-10 w-full rounded-[9px] border-0 bg-[var(--surface-card-bg)] pl-9 pr-14 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] shadow-[var(--shadow-search)] outline-none transition-shadow duration-[.12s] ease-out focus:shadow-[var(--focus-ring)]"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-[6px] bg-white px-[6px] py-[2px] text-[11px] font-medium text-[var(--ink-muted)] shadow-[var(--shadow-pill)]">
        ⌘K
      </span>
    </div>
  );
}
