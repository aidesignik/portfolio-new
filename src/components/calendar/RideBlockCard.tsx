import type { CSSProperties } from "react";
import { ArrowRight, ArrowLeftRight, Clock, Users } from "lucide-react";
import { RIDE_STATUS_ACCENT } from "./statusStyles";
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
  const accent = RIDE_STATUS_ACCENT[status];
  // A completed trip has nothing left pending — the bar reads as fully
  // done (solid) instead of colored-plus-grey-remainder.
  const isCompleted = status === "COMPLETED";

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-[8px] border border-[var(--border-hairline)] bg-white text-left shadow-[var(--shadow-card)] transition-shadow duration-[.12s] ease-out hover:shadow-[0_2px_8px_rgba(24,24,27,.10)]"
      title={`${clientLabel} · ${ride.pickupCity} ${ride.isRoundTrip ? "⇄" : "→"} ${ride.destinationCity}`}
    >
      <div className="flex flex-col gap-[6px] px-[10px] py-[10px]">
        <div className="flex h-[4px] shrink-0 items-center gap-[3px]">
          {isCompleted ? (
            <span className="h-full rounded-full" style={{ width: 39, background: accent }} />
          ) : (
            <>
              <span className="h-full rounded-full" style={{ width: 26, background: accent }} />
              <span className="h-full rounded-full" style={{ width: 10, background: "#E4E4E7" }} />
            </>
          )}
        </div>
        <div className="min-w-0">
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
        <div className="flex items-center gap-[8px] text-[12.5px]" style={{ color: "#55555C" }}>
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
              <DriverAvatar id={driverId ?? undefined} name={driverName} size="sm" muted />
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
