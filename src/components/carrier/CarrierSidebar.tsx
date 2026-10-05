"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Bus, Clock, CircleHelp } from "lucide-react";
import {
  CalendarIcon as CalendarOutline,
  InboxIcon as InboxOutline,
  BookmarkIcon as BookmarkOutline,
  UserIcon as UserOutline,
} from "@heroicons/react/24/outline";
import {
  CalendarIcon as CalendarSolid,
  InboxIcon as InboxSolid,
  BookmarkIcon as BookmarkSolid,
  UserIcon as UserSolid,
} from "@heroicons/react/24/solid";
import { Link, usePathname } from "@/i18n/navigation";

const ICON_SIZE_CLASS = "h-[17px] w-[17px] shrink-0";
const INACTIVE_COLOR = "#4A4A46";
const ACTIVE_TEXT_COLOR = "#141413";
const ACTIVE_ICON_COLOR = "#2B55E6";

// Each item renders its own icon so inactive/active can come from two
// genuinely different glyphs (Heroicons ships matched outline/solid pairs)
// rather than faking "filled" by tinting the same outline shape. Heroicons
// has no bus icon though (only a generic truck), which would misrepresent
// a bus/coach fleet — so Fleet alone keeps lucide's Bus icon for both
// states, with the active state approximated via a tinted fill.
interface NavItem {
  href: string;
  labelKey: string;
  renderIcon: (active: boolean) => ReactNode;
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
  "flex h-[42px] items-center gap-3 rounded-[10px] px-[10px] text-[14.5px] transition-colors duration-[.12s] ease-out";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations("nav");
  const showCount = item.count !== undefined && item.count > 0;

  return (
    <Link
      href={item.href}
      className={`${NAV_ITEM_CLASS} ${
        active
          ? "bg-[var(--surface-card-bg)] font-semibold shadow-[var(--shadow-nav-active)]"
          : "font-medium hover:bg-[rgba(20,20,19,.045)]"
      }`}
      style={{ color: active ? ACTIVE_TEXT_COLOR : INACTIVE_COLOR }}
    >
      {item.renderIcon(active)}
      <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
      {showCount ? (
        item.badge ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-[12px] font-semibold text-white">
            {item.count}
          </span>
        ) : (
          <span
            className="flex h-5 min-w-[22px] shrink-0 items-center justify-center rounded-full px-[6px] font-mono text-[12px] font-semibold"
            style={{ background: "rgba(20,20,19,.06)", color: "#57574F" }}
          >
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
    {
      href: "/carrier/dashboard",
      labelKey: "calendar",
      renderIcon: (active) =>
        active ? (
          <CalendarSolid className={ICON_SIZE_CLASS} style={{ color: ACTIVE_ICON_COLOR }} />
        ) : (
          <CalendarOutline className={ICON_SIZE_CLASS} strokeWidth={1.9} style={{ color: INACTIVE_COLOR }} />
        ),
    },
    {
      href: "/carrier/requests",
      labelKey: "requests",
      count: requestCount,
      badge: true,
      renderIcon: (active) =>
        active ? (
          <InboxSolid className={ICON_SIZE_CLASS} style={{ color: ACTIVE_ICON_COLOR }} />
        ) : (
          <InboxOutline className={ICON_SIZE_CLASS} strokeWidth={1.9} style={{ color: INACTIVE_COLOR }} />
        ),
    },
    {
      href: "/carrier/bookings",
      labelKey: "bookings",
      count: bookingCount,
      renderIcon: (active) =>
        active ? (
          <BookmarkSolid className={ICON_SIZE_CLASS} style={{ color: ACTIVE_ICON_COLOR }} />
        ) : (
          <BookmarkOutline className={ICON_SIZE_CLASS} strokeWidth={1.9} style={{ color: INACTIVE_COLOR }} />
        ),
    },
    {
      href: "/carrier/fleet",
      labelKey: "fleet",
      count: fleetCount,
      // No bus icon in Heroicons — same lucide glyph both states, active
      // tinted rather than swapped (see the comment above NavItem).
      renderIcon: (active) => (
        <Bus
          size={17}
          strokeWidth={1.9}
          color={active ? ACTIVE_ICON_COLOR : INACTIVE_COLOR}
          fill={active ? ACTIVE_ICON_COLOR : "none"}
          fillOpacity={active ? 0.16 : undefined}
          className="shrink-0"
        />
      ),
    },
    {
      href: "/carrier/drivers",
      labelKey: "drivers",
      count: driverCount,
      renderIcon: (active) =>
        active ? (
          <UserSolid className={ICON_SIZE_CLASS} style={{ color: ACTIVE_ICON_COLOR }} />
        ) : (
          <UserOutline className={ICON_SIZE_CLASS} strokeWidth={1.9} style={{ color: INACTIVE_COLOR }} />
        ),
    },
  ];

  return (
    <aside className="sticky top-0 h-dvh w-[252px] shrink-0">
      <div className="flex h-full flex-col gap-[10px] pt-[14px] pb-[18px] px-[10px]">
        <div className="flex h-[30px] shrink-0 items-center gap-[10px] px-[10px]">
          <div
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]"
            style={{ background: "#141413" }}
          >
            <span className="text-[15px] font-bold text-white">A</span>
          </div>
          <span className="text-[19px] font-bold tracking-[-0.025em]" style={{ color: "#141413" }}>
            Atlas
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-[10px] overflow-y-auto">
          <nav className="flex flex-col gap-[2px]">
            {mainItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </nav>

          {expiringItems.length > 0 ? (
            <>
              <div className="h-px shrink-0" style={{ background: "rgba(20,20,19,.07)" }} />
              <div className="flex flex-col gap-[8px] pt-[6px]">
                <div className="flex items-center justify-between px-[10px]">
                  <span
                    className="text-[11.5px] font-semibold uppercase tracking-[.06em]"
                    style={{ color: "#6E6E68" }}
                  >
                    {t("expiry.bannerTitle")}
                  </span>
                  <span
                    className="rounded-[6px] px-[6px] py-[2px] font-mono text-[11px] font-semibold"
                    style={{ background: "#FBE4E6", color: "#B4232F" }}
                  >
                    {expiringItems.length}
                  </span>
                </div>
                {expiringItems.map((item) => {
                  const isExpired = item.status === "expired";
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-3 rounded-[12px] bg-white p-[10px] transition-colors duration-[.12s] ease-out hover:bg-[rgba(20,20,19,.03)]"
                      style={{ boxShadow: "var(--ring-2)" }}
                    >
                      <span
                        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]"
                        style={{ background: isExpired ? "#FDECEE" : "#FEF3E2" }}
                      >
                        <Clock size={15} strokeWidth={2} style={{ color: isExpired ? "#C42B38" : "#B45309" }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold" style={{ color: "#141413" }}>
                          {item.subject}
                        </span>
                        <span
                          className="block truncate text-[12.5px]"
                          style={{ color: isExpired ? "#B4232F" : "#9A5B12" }}
                        >
                          {item.issue}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-auto flex shrink-0 flex-col gap-[2px] pt-[10px]" style={{ borderTop: "1px solid rgba(20,20,19,.07)" }}>
          <a
            href="mailto:support@atlas.example"
            className={`${NAV_ITEM_CLASS} font-medium hover:bg-[rgba(20,20,19,.045)]`}
            style={{ color: INACTIVE_COLOR }}
          >
            <CircleHelp size={17} strokeWidth={1.9} color={INACTIVE_COLOR} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{tNav("help")}</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
