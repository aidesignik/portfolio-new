"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Wrench, Plus } from "lucide-react";
import { RideBlockCard } from "./RideBlockCard";
import { AddVehiclePanel } from "@/components/forms/AddVehiclePanel";
import { AddDriverPanel } from "@/components/forms/AddDriverPanel";
import { CALENDAR_GRID_TEMPLATE } from "@/lib/tableLayout";
import type { CalendarBlock, CalendarDriver, CalendarRide, CalendarVehicle, ResourceGrouping } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const GRID_TEMPLATE_COLUMNS = CALENDAR_GRID_TEMPLATE;

export interface DragOverTarget {
  resourceId: string;
  conflict: boolean;
  message?: string;
}

interface Resource {
  id: string;
  name: string;
  plate: string | null;
  seats: number | null;
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

// Rides (and blocks) for the same resource that overlap in the days they
// span would otherwise sit exactly on top of each other. Greedily assigns
// each item to the first "lane" whose last item ends before this one
// starts — same interval-graph-coloring approach a day-view calendar uses
// to stack overlapping events side by side instead of overlapping them.
function assignLanes(items: { id: string; startIdx: number; endIdx: number }[]) {
  const laneEnds: number[] = [];
  const laneOf = new Map<string, number>();
  const sorted = [...items].sort((a, b) => a.startIdx - b.startIdx || a.endIdx - b.endIdx);
  for (const item of sorted) {
    let lane = laneEnds.findIndex((end) => end < item.startIdx);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endIdx);
    } else {
      laneEnds[lane] = item.endIdx;
    }
    laneOf.set(item.id, lane);
  }
  return { laneOf, laneCount: Math.max(1, laneEnds.length) };
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
  onResourceAdded,
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
  onResourceAdded: () => void;
}) {
  const t = useTranslations("carrier.calendar");
  const tCarrier = useTranslations("carrier");
  const tType = useTranslations("vehicleType");
  const [addingResource, setAddingResource] = useState(false);
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS));

  const resources: Resource[] =
    grouping === "vehicle"
      ? vehicles.map((v) => ({ id: v.id, name: `${tType(v.type)} ${v.model}`, plate: v.licensePlate, seats: v.seats }))
      : drivers.map((d) => ({ id: d.id, name: d.name, plate: null, seats: null }));

  const resourceCountLabel =
    grouping === "vehicle"
      ? t("vehicleCount", { count: vehicles.length })
      : t("driverCount", { count: drivers.length });

  function driverFor(ride: CalendarRide) {
    return ride.driverId ? drivers.find((d) => d.id === ride.driverId) : undefined;
  }
  function seatsFor(ride: CalendarRide) {
    return ride.vehicleId ? vehicles.find((v) => v.id === ride.vehicleId)?.seats ?? null : null;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
            <div className="flex h-12 items-center border-b border-r border-[var(--border-hairline)] px-[14px] text-[13px] text-[var(--ink-secondary)]">
              {resources.length > 0 ? resourceCountLabel : ""}
            </div>
            {days.map((day, i) => {
              const isToday = day.getTime() === today.getTime();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const weekday = day.toLocaleDateString(undefined, { weekday: "short" });
              const dateNum = day.getDate();
              return (
                <div
                  key={i}
                  className={`flex h-12 items-center gap-[8px] border-b border-r border-[var(--border-hairline)] px-[14px] last:border-r-0 ${
                    isWeekend && !isToday ? "bg-[var(--bg-weekend)]" : ""
                  }`}
                >
                  <span
                    className="text-[13.5px]"
                    style={{ color: isToday ? "#2563EB" : isWeekend ? "#A1A1AA" : "#6B6B72" }}
                  >
                    {weekday}
                  </span>
                  {isToday ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] text-[12.5px] font-semibold text-white">
                      {dateNum}
                    </span>
                  ) : (
                    <span
                      className="text-[13.5px] font-medium"
                      style={{ color: isWeekend ? "#6B6B72" : "#27272B" }}
                    >
                      {dateNum}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {resources.length === 0 ? (
            <p className="p-6 text-center text-[13.5px] text-[var(--ink-secondary)]">
              {grouping === "vehicle" ? t("noVehicles") : t("noDrivers")}
            </p>
          ) : (
            resources.map((resource) => {
              const resourceRides = rides
                .filter((r) => (grouping === "vehicle" ? r.vehicleId : r.driverId) === resource.id)
                .map((ride) => {
                  const startIdx = Math.max(0, dayIndex(weekStart, ride.departureAt));
                  const endIdx = ride.returnAt ? Math.min(6, dayIndex(weekStart, ride.returnAt)) : startIdx;
                  return { ride, startIdx, endIdx };
                });
              const resourceBlocks = blocks
                .filter((b) => (grouping === "vehicle" ? b.vehicleId : b.driverId) === resource.id)
                .map((block) => ({
                  block,
                  startIdx: Math.max(0, dayIndex(weekStart, block.startAt)),
                  endIdx: Math.min(6, dayIndex(weekStart, block.endAt)),
                }));
              const isDragTarget = dragOverTarget?.resourceId === resource.id;

              // Overlapping rides/blocks for this resource get their own lane
              // (row) instead of sitting on top of each other.
              const { laneOf, laneCount } = assignLanes([
                ...resourceRides.map(({ ride, startIdx, endIdx }) => ({ id: ride.id, startIdx, endIdx })),
                ...resourceBlocks.map(({ block, startIdx, endIdx }) => ({ id: block.id, startIdx, endIdx })),
              ]);

              return (
                <div key={resource.id} className="grid" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
                  <div className="flex min-h-[132px] flex-col justify-center gap-[2px] border-r border-b border-[var(--border-hairline)] px-5 py-[18px]">
                    <p className="truncate text-[14px] font-semibold text-[var(--ink-strong)]">{resource.name}</p>
                    {resource.plate || resource.seats ? (
                      <p className="truncate text-[13px] text-[var(--ink-secondary)]">
                        {resource.plate ? <span className="font-mono text-[12.5px]">{resource.plate}</span> : null}
                        {resource.plate && resource.seats ? " · " : ""}
                        {resource.seats ? `${resource.seats} ${tCarrier("fleetTable.seats")}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div
                    className="relative col-span-7 grid border-b border-[var(--border-hairline)]"
                    style={{
                      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                      gridTemplateRows: `repeat(${laneCount}, minmax(132px, auto))`,
                    }}
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
                    {days.map((day, i) => {
                      const isToday = day.getTime() === today.getTime();
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      return (
                        <div
                          key={i}
                          className={`border-r border-b border-[var(--border-soft)] last:border-r-0 ${
                            isDragTarget
                              ? dragOverTarget?.conflict
                                ? "bg-[var(--chip-critical)]/30"
                                : "bg-[var(--chip-positive)]/30"
                              : isToday
                                ? "bg-[var(--bg-today)]"
                                : isWeekend
                                  ? "bg-[var(--bg-weekend)]"
                                  : ""
                          }`}
                          style={{ gridRow: "1 / -1", gridColumn: i + 1 }}
                        />
                      );
                    })}

                    {resourceBlocks.map(({ block, startIdx, endIdx }) => (
                      <div
                        key={block.id}
                        className="z-0 flex h-10 items-center gap-[6px] truncate rounded-[9px] px-[10px] text-[13.5px] font-medium"
                        style={{
                          gridRow: (laneOf.get(block.id) ?? 0) + 1,
                          gridColumn: `${startIdx + 1} / ${endIdx + 2}`,
                          margin: "12px 10px",
                          background: "#EDE9FE",
                          color: "#3B1F87",
                          alignSelf: "start",
                        }}
                        title={block.note ?? undefined}
                      >
                        <Wrench size={14} strokeWidth={1.9} className="shrink-0" />
                        <span className="truncate">{t(`blockReason.${block.reason}`)}</span>
                      </div>
                    ))}

                    {resourceRides.map(({ ride, startIdx, endIdx }) => (
                      <div
                        key={ride.id}
                        className="z-10"
                        style={{
                          gridRow: (laneOf.get(ride.id) ?? 0) + 1,
                          gridColumn: `${startIdx + 1} / ${endIdx + 2}`,
                          margin: "12px 10px",
                        }}
                      >
                        <RideBlockCard
                          ride={ride}
                          onClick={() => onRideClick(ride.id)}
                          style={{ height: "100%" }}
                          seats={seatsFor(ride)}
                          driverName={driverFor(ride)?.name}
                          driverId={driverFor(ride)?.id}
                        />
                      </div>
                    ))}

                    {isDragTarget && dragOverTarget?.conflict && dragOverTarget.message ? (
                      <div
                        className="z-20 flex items-center rounded-[10px] px-2 py-1 text-[12.5px] font-semibold text-white"
                        style={{
                          gridRow: 1,
                          gridColumn: "1 / 8",
                          margin: "6px",
                          justifySelf: "start",
                          background: "#F87171",
                        }}
                      >
                        {dragOverTarget.message}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}

          <button
            type="button"
            onClick={() => setAddingResource(true)}
            className="flex h-12 w-full items-center gap-[6px] border-t border-[var(--border-hairline)] px-5 text-[13.5px] font-medium text-[var(--ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
          >
            <Plus size={14} strokeWidth={1.9} />
            {grouping === "vehicle" ? tCarrier("addVehicle") : tCarrier("addDriver")}
          </button>
        </div>
      </div>

      {addingResource && grouping === "vehicle" ? (
        <AddVehiclePanel
          onClose={() => setAddingResource(false)}
          onCreated={() => {
            setAddingResource(false);
            onResourceAdded();
          }}
        />
      ) : null}
      {addingResource && grouping === "driver" ? (
        <AddDriverPanel
          vehicles={vehicles}
          onClose={() => setAddingResource(false)}
          onCreated={() => {
            setAddingResource(false);
            onResourceAdded();
          }}
        />
      ) : null}
    </>
  );
}
