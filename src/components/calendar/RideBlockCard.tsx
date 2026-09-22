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
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`min-w-0 truncate rounded-md px-2 py-1 text-left text-xs shadow-sm transition-shadow hover:shadow-md ${RIDE_STATUS_STYLES[ride.status].block}`}
      title={`${clientLabel} · ${ride.pickupCity} → ${ride.destinationCity}`}
    >
      <div className="truncate font-medium">
        {time} · {clientLabel}
      </div>
      <div className="truncate opacity-80">
        {ride.pickupCity} → {ride.destinationCity}
      </div>
    </button>
  );
}
