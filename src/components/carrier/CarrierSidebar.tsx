"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Inbox, Bookmark, Bus, UserRound, Settings } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

interface NavItem {
  href: string;
  labelKey: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  count?: number;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations("nav");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex h-[42px] items-center gap-3 rounded-[10px] px-3 text-[14.5px] transition-colors duration-[.12s] ease-out ${
        active
          ? "bg-[var(--action-100)] font-bold text-[var(--action-800)]"
          : "font-medium text-[var(--ink-2)] hover:bg-[var(--border-soft)]"
      }`}
    >
      <Icon size={17} strokeWidth={1.9} color={active ? "#1E40AF" : "#6E6E76"} />
      <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
      {item.count !== undefined ? (
        <span
          className={`rounded-[6px] px-[7px] py-[3px] font-mono text-[11.5px] ${
            active ? "bg-[#BFD3FE] text-[var(--action-800)]" : "bg-[var(--border-soft)] text-[var(--ink-secondary)]"
          }`}
        >
          {item.count}
        </span>
      ) : null}
    </Link>
  );
}

export function CarrierSidebar({
  requestCount,
  fleetCount,
  driverCount,
  bookingCount,
}: {
  requestCount: number;
  fleetCount: number;
  driverCount: number;
  bookingCount: number;
}) {
  const pathname = usePathname();

  const mainItems: NavItem[] = [
    { href: "/carrier/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/carrier/requests", labelKey: "requests", icon: Inbox, count: requestCount },
    { href: "/carrier/bookings", labelKey: "bookings", icon: Bookmark, count: bookingCount },
    { href: "/carrier/fleet", labelKey: "fleet", icon: Bus, count: fleetCount },
    { href: "/carrier/drivers", labelKey: "drivers", icon: UserRound, count: driverCount },
  ];

  const footerItems: NavItem[] = [{ href: "/carrier/onboarding", labelKey: "settings", icon: Settings }];

  return (
    <aside className="flex w-[252px] shrink-0 flex-col gap-[22px] border-r border-[var(--border-hairline)] bg-[var(--bg-panel)] p-[14px] pt-5">
      <div className="px-2 text-[20px] font-extrabold tracking-[-0.015em] text-[var(--ink-primary)]">Atlas</div>
      <nav className="flex flex-col gap-1">
        {mainItems.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-1 border-t border-[var(--border-soft)] pt-[14px]">
        {footerItems.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </div>
    </aside>
  );
}
