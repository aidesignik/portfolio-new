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
    <div
      className="flex flex-wrap gap-[14px] px-5 py-4"
      style={{ borderTop: "1px solid var(--shell-hairline-row)", background: "var(--bg-canvas)" }}
    >
      <div className="flex-none basis-[168px]">
        <h2 className="text-[14px] font-bold" style={{ color: "var(--shell-ink-1)" }}>
          {t("unassignedTitle")}
        </h2>
        <p className="text-[12.5px]" style={{ color: "var(--shell-ink-faint)" }}>
          {t("unassignedHint")}
        </p>
      </div>
      {rides.map((ride) => (
        <button
          key={ride.id}
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            onDragStart(ride.id);
          }}
          onDragEnd={onDragEnd}
          onClick={() => onRideClick(ride.id)}
          className="flex min-w-[190px] flex-1 basis-[210px] cursor-grab flex-col gap-[3px] rounded-[11px] bg-white px-[11px] pb-[10px] pt-[9px] text-left transition-shadow duration-[.12s] ease-out hover:shadow-[0_2px_10px_rgba(20,20,19,.16)] active:cursor-grabbing"
          style={{ boxShadow: "var(--ring-1)" }}
        >
          <span className="h-1 w-7 shrink-0 rounded-full bg-[#FDBA74]" />
          <p className="truncate text-[13px] font-semibold" style={{ color: "var(--shell-ink-1)" }}>
            {ride.pickupCity} → {ride.destinationCity}
          </p>
          <p className="truncate text-[11.5px] font-semibold" style={{ color: "var(--shell-ink-secondary)" }}>
            {clientDisplayName(ride.client)}
          </p>
          <p className="truncate font-mono text-[11.5px]" style={{ color: "var(--shell-ink-faint)" }}>
            {new Date(ride.departureAt).toLocaleString()} · {ride.passengerCount} {t("pax")}
          </p>
        </button>
      ))}
    </div>
  );
}
