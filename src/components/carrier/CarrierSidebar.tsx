"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Calendar, Inbox, Bookmark, Bus, UserRound, CircleHelp } from "lucide-react";
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
  "flex h-[34px] items-center gap-3 rounded-[8px] px-[10px] text-[13.5px] transition-colors duration-[.12s] ease-out";

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
        active
          ? "bg-[var(--surface-card-bg)] font-semibold text-[#0D0D0D] shadow-[var(--shadow-surface-card)]"
          : "font-medium text-[#3F3F46] hover:bg-[#EBEBEB]"
      }`}
    >
      <Icon size={17} strokeWidth={1.9} color={active ? "#0D0D0D" : "#6E6E76"} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
      {showCount ? (
        item.badge ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-[12px] font-semibold text-white">
            {item.count}
          </span>
        ) : (
          <span className="shrink-0 font-mono text-[11.5px] text-[#8E8E93]">{item.count}</span>
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

  const hasCritical = expiringItems.some((item) => item.status === "expired");

  return (
    <aside className="sticky top-0 h-dvh w-[252px] shrink-0">
      <div className="flex h-full flex-col gap-[10px] pt-[14px] pb-[18px] px-[10px]">
        <div className="flex h-[28px] shrink-0 items-center px-[10px] text-[17px] font-extrabold text-[#0D0D0D]">
          Atlas
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-[10px] overflow-y-auto">
          <nav className="flex flex-col gap-[2px]">
            {mainItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </nav>

          {expiringItems.length > 0 ? (
            <div className="flex flex-col gap-[8px] pt-[6px]">
              <div className="flex items-center justify-between px-[10px]">
                <span className="text-[12px] font-normal text-[#8E8E93]">{t("expiry.bannerTitle")}</span>
                <span
                  className="rounded-[6px] px-[6px] py-[2px] font-mono text-[11px] font-medium"
                  style={{
                    background: hasCritical ? "#FBDADB" : "#FBEBC2",
                    color: hasCritical ? "#7F1D1D" : "#5C3B06",
                  }}
                >
                  {expiringItems.length}
                </span>
              </div>
              {expiringItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex flex-col rounded-[8px] px-[10px] py-[6px] transition-colors duration-[.12s] ease-out hover:bg-[#EBEBEB]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex w-[17px] shrink-0 items-center justify-center">
                      <span
                        className="h-[7px] w-[7px] rounded-full"
                        style={{ background: item.status === "expired" ? "#E5484D" : "#F59E0B" }}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#18181B]">
                      {item.subject}
                    </span>
                  </span>
                  <span className="truncate pl-[29px] text-[12px] text-[#6B6B72]">{item.issue}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex shrink-0 flex-col gap-[2px] border-t border-[#E6E6E6] pt-[10px]">
          <a href="mailto:support@atlas.example" className={`${NAV_ITEM_CLASS} font-medium text-[#3F3F46] hover:bg-[#EBEBEB]`}>
            <CircleHelp size={17} strokeWidth={1.9} color="#6E6E76" className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{tNav("help")}</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
