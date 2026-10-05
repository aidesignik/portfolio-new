import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowLeftRight, Clock, Users } from "lucide-react";
import { RIDE_STATUS_BG } from "./statusStyles";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { usePopover, PopoverPanel } from "@/components/ui/Popover";
import { clientDisplayName } from "@/lib/clientDisplay";
import { displayRideStatus } from "@/lib/rideStatus";
import { cityCode } from "@/lib/cityCodes";
import type { CalendarRide } from "./types";

// Must match the `@max-[160px]` container-query breakpoint used below —
// Tailwind can't consume a JS constant inside an arbitrary-value class, so
// the two are kept in sync by hand. Used to gate the route tooltip to
// compact cards only (it has no CSS-only way to do that, since it's
// portaled out of the card's own container-query subtree).
const COMPACT_BREAKPOINT_PX = 160;

export function RideBlockCard({
  ride,
  onClick,
  style,
  seats,
  driverName,
  driverId,
}: {
  ride: CalendarRide;
  onClick: () => void;
  style?: CSSProperties;
  seats?: number | null;
  driverName?: string | null;
  driverId?: string | null;
}) {
  const t = useTranslations("carrier.calendar");
  const time = new Date(ride.departureAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const clientLabel = clientDisplayName(ride.client);
  const status = displayRideStatus(ride);
  const background = RIDE_STATUS_BG[status];
  const routeArrow = ride.isRoundTrip ? "⇄" : "→";
  const route = `${ride.pickupCity} ${routeArrow} ${ride.destinationCity}`;
  const ariaLabel = t("cardAriaLabel", {
    route,
    client: clientLabel,
    time,
    driver: driverName ?? t("detail.noDriver"),
  });

  // Route tooltip — compact cards only. The card's own width is only known
  // at the moment the tooltip is about to open (there's no CSS-only way to
  // gate a portaled element on an ancestor's container-query state), so the
  // gate is a plain width check against the same breakpoint the CSS uses.
  const { open, triggerRef, panelRef, triggerProps, panelHoverProps } = usePopover({
    openDelayMs: 400,
    closeGraceMs: 0,
    enabled: () => (triggerRef.current?.getBoundingClientRect().width ?? Infinity) < COMPACT_BREAKPOINT_PX,
  });

  return (
    <button
      ref={triggerRef as React.Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      style={{ ...style, background, containerType: "inline-size" }}
      className="group relative flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[8px] text-left transition-[background-color,box-shadow,scale] duration-[.12s] ease-out hover:shadow-[0_1px_2px_rgba(20,20,19,.06),0_4px_12px_rgba(20,20,19,.06)] active:scale-[0.99] active:shadow-none"
      title={`${clientLabel} · ${route}`}
      aria-label={ariaLabel}
      {...triggerProps}
    >
      {/* Darken-on-interaction overlay, layered on top of the status fill
          rather than mixed into it, so the status color never shifts hue —
          only its perceived brightness. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[rgba(20,20,19,0)] transition-colors duration-[.12s] ease-out group-hover:bg-[rgba(20,20,19,.04)] group-active:bg-[rgba(20,20,19,.08)]"
      />

      {/* Wide layout — hidden once the card's own rendered width (not day
          span) drops below ~160px. */}
      <div className="relative flex flex-1 flex-col gap-[6px] px-[10px] py-[8px] @max-[160px]:hidden">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <p className="flex min-w-0 items-center gap-[5px] text-[14px] font-medium text-[var(--ink-primary)]">
            <span className="min-w-0 truncate">{ride.pickupCity}</span>
            {ride.isRoundTrip ? (
              <ArrowLeftRight size={14} strokeWidth={1.75} className="shrink-0" />
            ) : (
              <ArrowRight size={11} strokeWidth={2.2} className="shrink-0" />
            )}
            <span className="min-w-0 truncate">{ride.destinationCity}</span>
          </p>
          <p className="truncate text-[12.5px] text-[var(--ink-secondary)]">{clientLabel}</p>
        </div>
        <div className="mt-auto flex items-center gap-[8px] text-[12.5px]" style={{ color: "#55555C" }}>
          <div className="flex min-w-0 flex-1 items-center gap-[8px] overflow-hidden">
            <span className="flex min-w-0 shrink items-center gap-[3px]">
              <Clock size={13} strokeWidth={1.9} className="shrink-0" />
              <span className="min-w-0 truncate font-medium">{time}</span>
            </span>
            <span className="flex min-w-0 shrink items-center gap-[3px]">
              <Users size={13} strokeWidth={1.9} className="shrink-0" />
              <span className="min-w-0 truncate font-medium">
                {ride.passengerCount}
                {seats ? `/${seats}` : ""}
              </span>
            </span>
          </div>
          {driverName ? (
            <span className="shrink-0">
              <DriverAvatar id={driverId ?? undefined} name={driverName} size="sm" colorful />
            </span>
          ) : null}
        </div>
      </div>

      {/* Compact layout — only shown under ~160px: city codes instead of
          full names, no passenger count, smaller avatar, no clock icon. */}
      <div className="relative hidden flex-1 flex-col gap-[6px] px-[10px] py-[8px] @max-[160px]:flex">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <p className="truncate text-[14px] font-medium text-[var(--ink-primary)]">
            {cityCode(ride.pickupCity)} {routeArrow} {cityCode(ride.destinationCity)}
          </p>
          <p className="truncate text-[12.5px] text-[var(--ink-secondary)]">{clientLabel}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-[6px] text-[12.5px]" style={{ color: "#55555C" }}>
          <span className="min-w-0 truncate font-medium">{time}</span>
          {driverName ? (
            <span className="shrink-0">
              <DriverAvatar id={driverId ?? undefined} name={driverName} size="xs" colorful />
            </span>
          ) : null}
        </div>
      </div>

      <PopoverPanel
        open={open}
        triggerRef={triggerRef}
        panelRef={panelRef}
        hoverProps={panelHoverProps}
        placement="top"
        interactive={false}
        className="z-[70] whitespace-nowrap rounded-[8px] bg-[#1A1A19] px-[10px] py-[6px] text-[13px] font-medium text-white shadow-[0_4px_12px_rgba(20,20,19,.16)]"
      >
        {route}
      </PopoverPanel>
    </button>
  );
}
