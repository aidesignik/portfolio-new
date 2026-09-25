"use client";

import { useTranslations } from "next-intl";
import { clientDisplayName } from "@/lib/clientDisplay";
import type { CalendarRide } from "./types";

export function UnassignedQueue({
  rides,
  onDragStart,
  onDragEnd,
  onRideClick,
}: {
  rides: CalendarRide[];
  onDragStart: (rideId: string) => void;
  onDragEnd: () => void;
  onRideClick: (rideId: string) => void;
}) {
  const t = useTranslations("carrier.calendar");

  return (
    <div className="flex flex-wrap gap-[14px] border-t border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-5 py-4">
      <div className="flex-none basis-[168px]">
        <h2 className="text-[14px] font-bold text-[var(--ink-primary)]">{t("unassignedTitle")}</h2>
        <p className="text-[12.5px] text-[var(--ink-muted)]">{t("unassignedHint")}</p>
      </div>
      {rides.map((ride) => (
        <div
          key={ride.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            onDragStart(ride.id);
          }}
          onDragEnd={onDragEnd}
          onClick={() => onRideClick(ride.id)}
          className="flex min-w-[190px] flex-1 basis-[210px] cursor-grab flex-col gap-[3px] rounded-[11px] border border-[var(--border-hairline)] bg-[var(--bg-panel)] px-[11px] pb-[10px] pt-[9px] transition-shadow duration-[.12s] ease-out hover:shadow-[0_2px_10px_rgba(24,24,27,.16)] active:cursor-grabbing"
        >
          <span className="h-1 w-7 shrink-0 rounded-full bg-[#FDBA74]" />
          <p className="truncate text-[13px] font-semibold text-[var(--ink-primary)]">
            {ride.pickupCity} → {ride.destinationCity}
          </p>
          <p className="truncate text-[11.5px] font-semibold text-[var(--ink-2)]">{clientDisplayName(ride.client)}</p>
          <p className="truncate font-mono text-[11.5px] text-[var(--ink-muted)]">
            {new Date(ride.departureAt).toLocaleString()} · {ride.passengerCount} {t("pax")}
          </p>
        </div>
      ))}
    </div>
  );
}
