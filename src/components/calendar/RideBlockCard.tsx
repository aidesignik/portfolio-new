import type { CSSProperties } from "react";
import { RIDE_STATUS_STYLES } from "./statusStyles";
import { clientDisplayName } from "@/lib/clientDisplay";
import type { CalendarRide } from "./types";

export function RideBlockCard({
  ride,
  onClick,
  style,
}: {
  ride: CalendarRide;
  onClick: () => void;
  style?: CSSProperties;
}) {
  const time = new Date(ride.departureAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const clientLabel = clientDisplayName(ride.client);
  const statusStyle = RIDE_STATUS_STYLES[ride.status];
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`flex w-full min-w-0 flex-col gap-[3px] rounded-[11px] px-[11px] pb-[10px] pt-[9px] text-left transition-shadow duration-[.12s] ease-out ${statusStyle.card}`}
      title={`${clientLabel} · ${ride.pickupCity} → ${ride.destinationCity}`}
    >
      <span className="h-1 w-7 shrink-0 rounded-full" style={{ background: statusStyle.accent }} />
      <span className={`truncate text-[13px] font-bold ${statusStyle.text}`}>
        {ride.pickupCity} → {ride.destinationCity}
      </span>
      <span className="truncate text-[11.5px] font-semibold text-[var(--ink-2)]">{clientLabel}</span>
      <span className="truncate font-mono text-[11px] text-[var(--ink-muted)]">
        {time} · {ride.passengerCount} pax
      </span>
    </button>
  );
}
