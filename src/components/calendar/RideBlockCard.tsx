import type { CSSProperties } from "react";
import { Clock, Users, Ellipsis } from "lucide-react";
import { RIDE_STATUS_ACCENT } from "./statusStyles";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { clientDisplayName } from "@/lib/clientDisplay";
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
  const accent = RIDE_STATUS_ACCENT[ride.status];

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-[10px] border border-[var(--border-hairline)] bg-white text-left shadow-[var(--shadow-card)] transition-shadow duration-[.12s] ease-out hover:shadow-[0_2px_10px_rgba(24,24,27,.16)]"
      title={`${clientLabel} · ${ride.pickupCity} → ${ride.destinationCity}`}
    >
      <div className="flex h-[3px] w-full shrink-0">
        <span className="h-full" style={{ width: 18, background: accent }} />
        <span className="h-full flex-1" style={{ background: "#E4E4E7" }} />
      </div>
      <div className="flex flex-col gap-[8px] px-[14px] py-[12px]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-[var(--ink-primary)]">
              {ride.pickupCity} → {ride.destinationCity}
            </p>
            <p className="truncate text-[12.5px] text-[var(--ink-secondary)]">{clientLabel}</p>
          </div>
          <Ellipsis size={16} strokeWidth={1.9} color="#71717A" className="mt-[1px] shrink-0" />
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
