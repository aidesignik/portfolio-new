"use client";

import { useTranslations } from "next-intl";
import { RideBlockCard } from "./RideBlockCard";
import { BLOCK_PATTERN_STYLE } from "./statusStyles";
import type { CalendarBlock, CalendarDriver, CalendarRide, CalendarVehicle, ResourceGrouping } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DragOverTarget {
  resourceId: string;
  conflict: boolean;
  message?: string;
}

interface Resource {
  id: string;
  label: string;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayIndex(weekStart: Date, dateStr: string) {
  const d = startOfDay(new Date(dateStr));
  return Math.round((d.getTime() - weekStart.getTime()) / DAY_MS);
}

export function ResourceTimelineGrid({
  weekStart,
  grouping,
  vehicles,
  drivers,
  rides,
  blocks,
  onRideClick,
  onDropRide,
  dragOverTarget,
  onDragOverResource,
  onDragLeave,
  draggingRideId,
}: {
  weekStart: Date;
  grouping: ResourceGrouping;
  vehicles: CalendarVehicle[];
  drivers: CalendarDriver[];
  rides: CalendarRide[];
  blocks: CalendarBlock[];
  onRideClick: (rideId: string) => void;
  onDropRide: (resourceId: string) => void;
  dragOverTarget: DragOverTarget | null;
  onDragOverResource: (resourceId: string) => void;
  onDragLeave: () => void;
  draggingRideId: string | null;
}) {
  const t = useTranslations("carrier.calendar");
  const tType = useTranslations("vehicleType");
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS));

  const resources: Resource[] =
    grouping === "vehicle"
      ? vehicles.map((v) => ({
          id: v.id,
          label: `${tType(v.type)} ${v.model}${v.licensePlate ? ` · ${v.licensePlate}` : ""}`,
        }))
      : drivers.map((d) => ({ id: d.id, label: d.name }));

  if (resources.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
        {grouping === "vehicle" ? t("noVehicles") : t("noDrivers")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <div className="min-w-[860px]">
        <div className="grid" style={{ gridTemplateColumns: "180px repeat(7, minmax(100px, 1fr))" }}>
          <div className="border-b border-r border-zinc-200 bg-zinc-50" />
          {days.map((day, i) => (
            <div
              key={i}
              className={`border-b border-zinc-200 px-2 py-2 text-center text-xs font-medium ${
                day.getTime() === today.getTime() ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-600"
              }`}
            >
              {day.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
            </div>
          ))}
        </div>

        {resources.map((resource) => {
          const resourceRides = rides.filter(
            (r) => (grouping === "vehicle" ? r.vehicleId : r.driverId) === resource.id,
          );
          const resourceBlocks = blocks.filter(
            (b) => (grouping === "vehicle" ? b.vehicleId : b.driverId) === resource.id,
          );
          const isDragTarget = dragOverTarget?.resourceId === resource.id;

          return (
            <div
              key={resource.id}
              className="grid"
              style={{ gridTemplateColumns: "180px repeat(7, minmax(100px, 1fr))" }}
            >
              <div className="flex items-center border-b border-r border-zinc-200 px-3 py-3 text-sm font-medium text-zinc-900">
                {resource.label}
              </div>
              <div
                className="relative col-span-7 grid border-b border-zinc-200"
                style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))", minHeight: "3.75rem" }}
                onDragOver={(e) => {
                  if (!draggingRideId) return;
                  e.preventDefault();
                  onDragOverResource(resource.id);
                }}
                onDragLeave={onDragLeave}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingRideId) onDropRide(resource.id);
                }}
              >
                {days.map((_, i) => (
                  <div
                    key={i}
                    className={`border-r border-zinc-100 last:border-r-0 ${
                      isDragTarget ? (dragOverTarget?.conflict ? "bg-red-50" : "bg-emerald-50") : ""
                    }`}
                    style={{ gridRow: 1, gridColumn: i + 1 }}
                  />
                ))}

                {resourceBlocks.map((block) => {
                  const startIdx = Math.max(0, dayIndex(weekStart, block.startAt));
                  const endIdx = Math.min(6, dayIndex(weekStart, block.endAt));
                  return (
                    <div
                      key={block.id}
                      className="z-0 flex items-center truncate rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600"
                      style={{
                        gridRow: 1,
                        gridColumn: `${startIdx + 1} / ${endIdx + 2}`,
                        margin: "0.25rem",
                        ...BLOCK_PATTERN_STYLE,
                      }}
                      title={block.note ?? undefined}
                    >
                      {t(`blockReason.${block.reason}`)}
                    </div>
                  );
                })}

                {resourceRides.map((ride) => {
                  const startIdx = Math.max(0, dayIndex(weekStart, ride.departureAt));
                  const endIdx = ride.returnAt
                    ? Math.min(6, dayIndex(weekStart, ride.returnAt))
                    : startIdx;
                  return (
                    <div
                      key={ride.id}
                      className="z-10"
                      style={{ gridRow: 1, gridColumn: `${startIdx + 1} / ${endIdx + 2}`, margin: "0.25rem" }}
                    >
                      <RideBlockCard ride={ride} onClick={() => onRideClick(ride.id)} style={{ height: "100%" }} />
                    </div>
                  );
                })}

                {isDragTarget && dragOverTarget?.conflict && dragOverTarget.message ? (
                  <div
                    className="z-20 flex items-center rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white shadow-lg"
                    style={{ gridRow: 1, gridColumn: "1 / 8", margin: "0.25rem", justifySelf: "start" }}
                  >
                    {dragOverTarget.message}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
