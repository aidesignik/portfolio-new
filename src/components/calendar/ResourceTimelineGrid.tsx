"use client";

import { useTranslations } from "next-intl";
import { RideBlockCard } from "./RideBlockCard";
import { BLOCK_PATTERN_STYLE } from "./statusStyles";
import type { CalendarBlock, CalendarDriver, CalendarRide, CalendarVehicle, ResourceGrouping } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const GRID_TEMPLATE_COLUMNS = "208px repeat(7, minmax(100px, 1fr))";

export interface DragOverTarget {
  resourceId: string;
  conflict: boolean;
  message?: string;
}

interface Resource {
  id: string;
  name: string;
  plate: string | null;
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
      ? vehicles.map((v) => ({ id: v.id, name: `${tType(v.type)} ${v.model}`, plate: v.licensePlate }))
      : drivers.map((d) => ({ id: d.id, name: d.name, plate: null }));

  if (resources.length === 0) {
    return (
      <p className="p-6 text-center text-[13.5px] text-[var(--ink-muted)]">
        {grouping === "vehicle" ? t("noVehicles") : t("noDrivers")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[860px]">
        <div className="grid" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
          <div className="border-b border-r border-[var(--border-hairline)] bg-[var(--bg-subtle)]" />
          {days.map((day, i) => {
            const isToday = day.getTime() === today.getTime();
            return (
              <div
                key={i}
                className={`flex h-11 items-center justify-center border-b border-r border-[var(--border-hairline)] px-2 text-[13px] font-bold last:border-r-0 ${
                  isToday ? "bg-[var(--select-tint)] text-[var(--action-800)]" : "bg-[var(--bg-subtle)] text-[var(--ink-2)]"
                }`}
              >
                {day.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
              </div>
            );
          })}
        </div>

        {resources.map((resource) => {
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
              <div className="flex flex-col justify-center gap-[1px] border-r border-b border-[var(--border-hairline)] px-[14px] py-3">
                <p className="truncate text-[13.5px] font-bold text-[var(--ink-primary)]">{resource.name}</p>
                {resource.plate ? (
                  <p className="truncate font-mono text-[11.5px] text-[var(--ink-muted)]">{resource.plate}</p>
                ) : null}
              </div>
              <div
                className="relative col-span-7 grid border-b border-[var(--border-hairline)]"
                style={{
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gridTemplateRows: `repeat(${laneCount}, minmax(96px, auto))`,
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
                  return (
                    <div
                      key={i}
                      className={`border-r border-b border-[var(--border-soft)] last:border-r-0 ${
                        isDragTarget
                          ? dragOverTarget?.conflict
                            ? "bg-[var(--chip-critical)]/30"
                            : "bg-[var(--chip-positive)]/30"
                          : isToday
                            ? "bg-[var(--select-tint)]"
                            : ""
                      }`}
                      style={{ gridRow: "1 / -1", gridColumn: i + 1 }}
                    />
                  );
                })}

                {resourceBlocks.map(({ block, startIdx, endIdx }) => (
                  <div
                    key={block.id}
                    className="z-0 flex items-center truncate rounded-[10px] border border-[var(--border-strong)] px-2 py-1 text-[12.5px] text-[var(--ink-secondary)]"
                    style={{
                      gridRow: (laneOf.get(block.id) ?? 0) + 1,
                      gridColumn: `${startIdx + 1} / ${endIdx + 2}`,
                      margin: "6px",
                      ...BLOCK_PATTERN_STYLE,
                    }}
                    title={block.note ?? undefined}
                  >
                    {t(`blockReason.${block.reason}`)}
                  </div>
                ))}

                {resourceRides.map(({ ride, startIdx, endIdx }) => (
                  <div
                    key={ride.id}
                    className="z-10"
                    style={{
                      gridRow: (laneOf.get(ride.id) ?? 0) + 1,
                      gridColumn: `${startIdx + 1} / ${endIdx + 2}`,
                      margin: "6px",
                    }}
                  >
                    <RideBlockCard ride={ride} onClick={() => onRideClick(ride.id)} style={{ height: "100%" }} />
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
        })}
      </div>
    </div>
  );
}
