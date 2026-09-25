"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Calendar, Inbox, Bookmark, Bus, UserRound, Settings, CircleHelp } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

interface NavItem {
  href: string;
  labelKey: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; color?: string; className?: string }>;
  count?: number;
  badge?: boolean;
}

export interface SidebarExpiringItem {
  id: string;
  href: string;
  subject: string;
  status: "expired" | "expiringSoon";
  issue: string;
}

const NAV_ITEM_CLASS =
  "flex h-[38px] items-center gap-3 rounded-[8px] px-3 text-[14px] font-medium transition-colors duration-[.12s] ease-out";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations("nav");
  const Icon = item.icon;
  const showCount = item.count !== undefined && item.count > 0;

  return (
    <Link
      href={item.href}
      className={`${NAV_ITEM_CLASS} ${
        active ? "bg-[var(--action-bg)] text-white" : "text-[var(--ink-body)] hover:bg-[var(--border-soft)]"
      }`}
    >
      <Icon size={16} strokeWidth={1.9} color={active ? "#FFFFFF" : "#6B6B72"} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
      {showCount ? (
        item.badge ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-[12px] font-semibold text-white">
            {item.count}
          </span>
        ) : (
          <span className={`shrink-0 text-[13px] ${active ? "text-white/75" : "text-[var(--ink-muted)]"}`}>
            {item.count}
          </span>
        )
      ) : null}
    </Link>
  );
}

export function CarrierSidebar({
  requestCount,
  fleetCount,
  driverCount,
  bookingCount,
  expiringItems,
}: {
  requestCount: number;
  fleetCount: number;
  driverCount: number;
  bookingCount: number;
  expiringItems: SidebarExpiringItem[];
}) {
  const pathname = usePathname();
  const t = useTranslations("carrier");
  const tNav = useTranslations("nav");

  const mainItems: NavItem[] = [
    { href: "/carrier/dashboard", labelKey: "calendar", icon: Calendar },
    { href: "/carrier/requests", labelKey: "requests", icon: Inbox, count: requestCount, badge: true },
    { href: "/carrier/bookings", labelKey: "bookings", icon: Bookmark, count: bookingCount },
    { href: "/carrier/fleet", labelKey: "fleet", icon: Bus, count: fleetCount },
    { href: "/carrier/drivers", labelKey: "drivers", icon: UserRound, count: driverCount },
  ];

  return (
    <aside className="sticky top-0 flex h-dvh w-[240px] shrink-0 flex-col gap-[28px] border-r border-[var(--border-hairline)] bg-white px-4 pb-5 pt-6">
      <div className="shrink-0 px-2 text-[19px] font-bold tracking-[-0.015em] text-[var(--ink-primary)]">Atlas</div>

      <div className="flex min-h-0 flex-1 flex-col gap-[28px] overflow-y-auto">
        <nav className="flex flex-col gap-1">
          {mainItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>

        {expiringItems.length > 0 ? (
          <div className="flex flex-col gap-[10px] border-t border-[var(--border-hairline)] pt-[22px]">
            <div className="flex items-center justify-between px-3">
              <span className="text-[14px] font-semibold text-[var(--ink-primary)]">{t("expiry.bannerTitle")}</span>
              <span className="text-[13px] font-semibold text-[var(--ink-destructive)]">{expiringItems.length}</span>
            </div>
            <div className="flex flex-col">
              {expiringItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-2 rounded-[8px] px-3 py-2 transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
                >
                  <span className="mt-[3px] h-3 w-3 shrink-0 rounded-[3px]" style={{ background: "#FBBEC0" }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-[var(--ink-primary)]">
                      {item.subject}
                    </span>
                    <span className="block truncate text-[12.5px] text-[var(--ink-destructive)]">{item.issue}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex shrink-0 flex-col gap-1">
        <NavLink
          item={{ href: "/carrier/onboarding", labelKey: "settings", icon: Settings }}
          active={isActive(pathname, "/carrier/onboarding")}
        />
        <a href="mailto:support@atlas.example" className={`${NAV_ITEM_CLASS} text-[var(--ink-body)] hover:bg-[var(--border-soft)]`}>
          <CircleHelp size={16} strokeWidth={1.9} color="#6B6B72" className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{tNav("help")}</span>
        </a>
      </div>
    </aside>
  );
}
