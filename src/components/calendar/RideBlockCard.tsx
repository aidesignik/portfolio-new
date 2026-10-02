import type { CSSProperties } from "react";
import { ArrowRight, ArrowLeft, Clock, Users } from "lucide-react";
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
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-[10px] border border-[var(--border-hairline)] bg-white text-left shadow-[var(--shadow-card)] transition-shadow duration-[.12s] ease-out hover:shadow-[0_2px_10px_rgba(24,24,27,.16)]"
      title={`${clientLabel} · ${ride.pickupCity} ${ride.isRoundTrip ? "⇄" : "→"} ${ride.destinationCity}`}
    >
      <div className="flex flex-col gap-[8px] px-[14px] py-[12px]">
        <div className="flex h-[3px] shrink-0 items-center gap-[3px]">
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
            <span className="flex shrink-0 items-center gap-[5px]">
              <ArrowRight size={11} strokeWidth={2.2} className="shrink-0" />
              {ride.isRoundTrip ? <ArrowLeft size={11} strokeWidth={2.2} className="shrink-0" /> : null}
            </span>
            <span className="min-w-0 truncate">{ride.destinationCity}</span>
          </p>
          <p className="truncate text-[12.5px] text-[var(--ink-secondary)]">{clientLabel}</p>
        </div>
        <div className="flex items-center gap-[8px] text-[12.5px]" style={{ color: "#55555C" }}>
          <div className="flex min-w-0 flex-1 items-center gap-[10px] overflow-hidden">
            <span className="flex shrink-0 items-center gap-[4px]">
              <Clock size={13} strokeWidth={1.9} className="shrink-0" />
              {time}
            </span>
            <span className="flex shrink-0 items-center gap-[4px]">
              <Users size={13} strokeWidth={1.9} className="shrink-0" />
              {ride.passengerCount}
              {seats ? `/${seats}` : ""}
            </span>
          </div>
          {driverName ? (
            <span className="shrink-0">
              <DriverAvatar id={driverId ?? undefined} name={driverName} size="sm" />
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
