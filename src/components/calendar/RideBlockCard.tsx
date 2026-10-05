import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Clock, Users } from "lucide-react";
import { RIDE_STATUS_BG, RIDE_STATUS_DOT, RIDE_STATUS_HEX, RIDE_STATUS_TEXT_1, RIDE_STATUS_TEXT_2 } from "./statusStyles";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { clientDisplayName } from "@/lib/clientDisplay";
import { displayRideStatus } from "@/lib/rideStatus";
import { cityCode } from "@/lib/cityCodes";
import type { CalendarRide } from "./types";

function hexToRgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// One consistent round-trip glyph, tinted in the status color, for every
// route at every card width — previously the wide layout drew an SVG arrow
// icon while the compact layout embedded a plain unicode arrow character
// in the text (and a different one than the wide layout's at that), so the
// same round trip could show two different-looking glyphs depending on
// which layout happened to render.
function RouteIcon({ roundTrip, color }: { roundTrip: boolean; color: string }) {
  return roundTrip ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <path d="M3 7h15m0 0-4-4m4 4-4 4" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 17H6m0 0 4-4m-4 4 4 4" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <path d="M4 12h16m0 0-6-6m6 6-6 6" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Status conveyed by shape (dot vs. labeled pill), not color alone — a
// small dot + halo with a title/tooltip for a single-day card, or a
// labeled pill for a card wide enough (2+ days) to carry the extra text.
function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="relative inline-flex shrink-0" title={label} aria-label={label}>
      <span className="absolute inset-0 -m-[3px] rounded-full" style={{ background: hexToRgba(color, 0.25) }} />
      <span className="relative block h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

export function RideBlockCard({
  ride,
  onClick,
  style,
  seats,
  driverName,
  driverId,
  daySpan = 1,
}: {
  ride: CalendarRide;
  onClick: () => void;
  style?: CSSProperties;
  seats?: number | null;
  driverName?: string | null;
  driverId?: string | null;
  // Number of day-columns this card spans — drives the status dot vs.
  // labeled pill choice (a pill needs the extra width a 2+ day card has).
  daySpan?: number;
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
  const dotColor = RIDE_STATUS_DOT[status];
  const hexColor = RIDE_STATUS_HEX[status];
  const textCaption = RIDE_STATUS_TEXT_1[status];
  const textMeta = RIDE_STATUS_TEXT_2[status];
  const statusLabel = t(`legend.${status}`);
  const routeArrow = ride.isRoundTrip ? "⇄" : "→";
  const route = `${ride.pickupCity} ${routeArrow} ${ride.destinationCity}`;
  const ariaLabel = t("cardAriaLabel", {
    route,
    client: clientLabel,
    time,
    driver: driverName ?? t("detail.noDriver"),
  });
  const capacityPct = seats ? Math.min(100, Math.round((ride.passengerCount / seats) * 100)) : null;
  const multiDay = daySpan >= 2;

  return (
    <button
      type="button"
      onClick={onClick}
      style={
        {
          ...style,
          background,
          containerType: "inline-size",
          "--card-ring": `inset 0 0 0 1px ${hexToRgba(hexColor, 0.16)}`,
        } as CSSProperties
      }
      className="group relative flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[12px] text-left shadow-[var(--card-ring)] transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:shadow-[var(--card-ring),0_6px_16px_-8px_rgba(20,20,19,.25)] active:translate-y-0 active:shadow-[var(--card-ring)]"
      title={`${clientLabel} · ${route}`}
      aria-label={ariaLabel}
    >
      {/* Wide layout — hidden once the card's own rendered width (not day
          span) drops below ~160px. */}
      <div className="relative flex flex-1 flex-col gap-[6px] px-[14px] py-[12px] @max-[160px]:hidden">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="flex min-w-0 items-center gap-[6px] text-[14.5px] font-semibold" style={{ color: "var(--shell-ink-1)" }}>
              <span className="min-w-0 truncate">{ride.pickupCity}</span>
              <RouteIcon roundTrip={ride.isRoundTrip} color={hexColor} />
              <span className="min-w-0 truncate">{ride.destinationCity}</span>
            </p>
            <p className="truncate text-[12.5px] font-medium" style={{ color: textCaption }}>
              {clientLabel}
            </p>
          </div>
          {multiDay ? (
            <span
              className="flex h-[22px] shrink-0 items-center gap-[6px] rounded-full px-[8px] text-[11.5px] font-semibold"
              style={{ background: "rgba(255,255,255,.7)", color: textMeta }}
            >
              <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: dotColor }} />
              {statusLabel}
            </span>
          ) : (
            <span className="mt-[3px]">
              <StatusDot color={dotColor} label={statusLabel} />
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center gap-[10px] text-[13px] font-medium" style={{ color: textMeta }}>
          <span className="flex min-w-0 shrink items-center gap-[4px]">
            <Clock size={13} strokeWidth={1.9} className="shrink-0" />
            <span className="min-w-0 truncate">{time}</span>
          </span>
          <span className="flex min-w-0 shrink items-center gap-[6px]">
            <Users size={13} strokeWidth={1.9} className="shrink-0" />
            <span className="min-w-0 truncate">
              {ride.passengerCount}
              {seats ? `/${seats}` : ""}
            </span>
            {capacityPct !== null ? (
              <span
                className="h-[4px] w-[32px] shrink-0 overflow-hidden rounded-full"
                style={{ background: hexToRgba(hexColor, 0.18) }}
              >
                <span className="block h-full rounded-full" style={{ width: `${capacityPct}%`, background: hexColor }} />
              </span>
            ) : null}
          </span>
          {driverName ? (
            <span className="ml-auto shrink-0">
              <DriverAvatar id={driverId ?? undefined} name={driverName} size="sm" ringColor={background} />
            </span>
          ) : null}
        </div>
      </div>

      {/* Compact layout — only shown under ~160px: city codes instead of
          full names, no passenger count, smaller avatar, no clock icon. */}
      <div className="relative hidden flex-1 flex-col gap-[6px] px-[10px] py-[8px] @max-[160px]:flex">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-[4px] truncate text-[14px] font-semibold" style={{ color: "var(--shell-ink-1)" }}>
            <span className="truncate">{cityCode(ride.pickupCity)}</span>
            <RouteIcon roundTrip={ride.isRoundTrip} color={hexColor} />
            <span className="truncate">{cityCode(ride.destinationCity)}</span>
          </p>
          <StatusDot color={dotColor} label={statusLabel} />
        </div>
        <p className="truncate text-[12.5px] font-medium" style={{ color: textCaption }}>
          {clientLabel}
        </p>
        <div className="mt-auto flex items-center justify-between gap-[6px] text-[13px] font-medium" style={{ color: textMeta }}>
          <span className="min-w-0 truncate">{time}</span>
          {driverName ? (
            <span className="shrink-0">
              <DriverAvatar id={driverId ?? undefined} name={driverName} size="2xs" ringColor={background} />
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
