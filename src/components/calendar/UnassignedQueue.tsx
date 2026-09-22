"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
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
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">{t("unassignedTitle")}</h2>
        <p className="text-xs text-zinc-500">{t("unassignedHint")}</p>
      </div>
      <div className="space-y-2">
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
            className="cursor-grab active:cursor-grabbing"
          >
            <Card className="space-y-1 border-dashed transition-shadow hover:shadow-md">
              <p className="text-sm font-medium text-zinc-900">{clientDisplayName(ride.client)}</p>
              <p className="text-xs text-zinc-600">
                {new Date(ride.departureAt).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-600">
                {ride.pickupCity} → {ride.destinationCity}
              </p>
              <p className="text-xs text-zinc-500">
                {ride.passengerCount} {t("pax")}
              </p>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
