import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowLeftRight, Clock, Users } from "lucide-react";
import { RIDE_STATUS_BG, RIDE_STATUS_DOT, RIDE_STATUS_TEXT } from "./statusStyles";
import { DriverAvatar, type DriverAvatarDriver } from "@/components/ui/DriverAvatar";
import { clientDisplayName } from "@/lib/clientDisplay";
import { displayRideStatus } from "@/lib/rideStatus";
import { cityCode } from "@/lib/cityCodes";
import type { CalendarRide, RideStatus } from "./types";

// Top-right status tag — a labeled pill once the card (not its day span)
// is wide enough, collapsing to just the dot (with a soft halo, and the
// status on hover/aria) below ~180px. Both variants render at once and
// toggle via the card's own container query, same mechanism as the
// wide/compact body layout below, so this follows the card's actual
// rendered width rather than guessing from how many days it spans.
function StatusTag({ status, label, ariaLabel }: { status: RideStatus; label: string; ariaLabel: string }) {
  const dot = RIDE_STATUS_DOT[status];
  return (
    <>
      <span
        className="flex h-[22px] shrink-0 items-center gap-[5px] rounded-full px-[8px] @max-[180px]:hidden"
        style={{ background: "rgba(255,255,255,.7)" }}
      >
        <span aria-hidden className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: dot }} />
        <span className="text-[11.5px] font-semibold" style={{ color: RIDE_STATUS_TEXT[status] }}>
          {label}
        </span>
      </span>
      <span
        className="hidden h-[8px] w-[8px] shrink-0 rounded-full @max-[180px]:block"
        style={{ background: dot, boxShadow: `0 0 0 3px color-mix(in srgb, ${dot} 15%, transparent)` }}
        title={label}
        aria-label={ariaLabel}
      />
    </>
  );
}

export function RideBlockCard({
  ride,
  onClick,
  style,
  seats,
  driver,
}: {
  ride: CalendarRide;
  onClick: () => void;
  style?: CSSProperties;
  seats?: number | null;
  driver?: DriverAvatarDriver | null;
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
    driver: driver?.name ?? t("detail.noDriver"),
  });
  const statusLabel = t(`legend.${status}`);
  const statusAriaLabel = t("statusAriaLabel", { status: statusLabel });
  const titleColor = status === "CANCELLED" ? "var(--ink-muted)" : "var(--ink-primary)";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...style, background, containerType: "inline-size" }}
      className="group relative flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[8px] text-left transition-[background-color,box-shadow,scale] duration-[.12s] ease-out hover:shadow-[0_1px_2px_rgba(20,20,19,.06),0_4px_12px_rgba(20,20,19,.06)] active:scale-[0.99] active:shadow-none"
      title={`${clientLabel} · ${route}`}
      aria-label={ariaLabel}
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
          <div className="flex items-start justify-between gap-[6px]">
            <p className="flex min-w-0 items-center gap-[5px] text-[14px] font-medium" style={{ color: titleColor }}>
              <span className="min-w-0 truncate">{ride.pickupCity}</span>
              {ride.isRoundTrip ? (
                <ArrowLeftRight size={14} strokeWidth={1.75} className="shrink-0" />
              ) : (
                <ArrowRight size={11} strokeWidth={2.2} className="shrink-0" />
              )}
              <span className="min-w-0 truncate">{ride.destinationCity}</span>
            </p>
            <StatusTag status={status} label={statusLabel} ariaLabel={statusAriaLabel} />
          </div>
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
          {driver ? (
            <span className="shrink-0">
              <DriverAvatar driver={driver} size={24} ring decorative />
            </span>
          ) : null}
        </div>
      </div>

      {/* Compact layout — only shown under ~160px: city codes instead of
          full names, no passenger count, smaller avatar, no clock icon. */}
      <div className="relative hidden flex-1 flex-col gap-[6px] px-[10px] py-[8px] @max-[160px]:flex">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <div className="flex items-start justify-between gap-[6px]">
            <p className="min-w-0 truncate text-[14px] font-medium" style={{ color: titleColor }}>
              {cityCode(ride.pickupCity)} {routeArrow} {cityCode(ride.destinationCity)}
            </p>
            <StatusTag status={status} label={statusLabel} ariaLabel={statusAriaLabel} />
          </div>
          <p className="truncate text-[12.5px] text-[var(--ink-secondary)]">{clientLabel}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-[6px] text-[12.5px]" style={{ color: "#55555C" }}>
          <span className="min-w-0 truncate font-medium">{time}</span>
          {driver ? (
            <span className="shrink-0">
              <DriverAvatar driver={driver} size={24} ring decorative />
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
