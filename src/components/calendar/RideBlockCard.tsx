import type { CSSProperties } from "react";
import { ArrowRight, ArrowLeftRight, Clock, Users } from "lucide-react";
import { RIDE_STATUS_BG } from "./statusStyles";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { clientDisplayName } from "@/lib/clientDisplay";
import { displayRideStatus } from "@/lib/rideStatus";
import type { CalendarRide } from "./types";

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
  const time = new Date(ride.departureAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const clientLabel = clientDisplayName(ride.client);
  const status = displayRideStatus(ride);
  const background = RIDE_STATUS_BG[status];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...style, background }}
      className="group relative flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[8px] text-left transition-[background-color,box-shadow,scale] duration-[.12s] ease-out hover:shadow-[0_1px_2px_rgba(20,20,19,.06),0_4px_12px_rgba(20,20,19,.06)] active:scale-[0.99] active:shadow-none"
      title={`${clientLabel} · ${ride.pickupCity} ${ride.isRoundTrip ? "⇄" : "→"} ${ride.destinationCity}`}
    >
      {/* Darken-on-interaction overlay, layered on top of the status fill
          rather than mixed into it, so the status color never shifts hue —
          only its perceived brightness. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[rgba(20,20,19,0)] transition-colors duration-[.12s] ease-out group-hover:bg-[rgba(20,20,19,.04)] group-active:bg-[rgba(20,20,19,.08)]"
      />
      <div className="relative flex flex-1 flex-col gap-[6px] px-[10px] py-[8px]">
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
    </button>
  );
}
