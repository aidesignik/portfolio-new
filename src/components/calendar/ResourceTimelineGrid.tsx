"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Wrench, Plus, Bus, Van, UserRound } from "lucide-react";
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
  // Raw vehicle-type enum (e.g. "VAN", "COACH") — only set for grouping
  // === "vehicle", used to pick the resource column's icon tile glyph.
  vehicleType?: string;
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
  const locale = useLocale();
  // sr's default Intl formatting is Cyrillic; the rest of this app's
  // Serbian copy is Latin, so map to the Latin variant like the DatePicker
  // already does (see src/lib/pickerDateFormat.ts).
  const intlLocale = locale === "sr" ? "sr-Latn" : "en";
  const [addingResource, setAddingResource] = useState(false);
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS));

  const resources: Resource[] =
    grouping === "vehicle"
      ? vehicles.map((v) => ({
          id: v.id,
          name: `${tType(v.type)} ${v.model}`,
          plate: v.licensePlate,
          seats: v.seats,
          vehicleType: v.type,
        }))
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
      {/* No overflow/scroll declared here — the parent (RidesCalendar) owns
          the single scroll container for both axes, which is what lets the
          sticky header (top) and sticky resource column (left) below both
          resolve against the same scrolling ancestor. */}
      <div className="min-w-full">
        <div className="sticky top-0 z-20 grid" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
            <div
              className="sticky left-0 z-30 flex min-h-[56px] items-center bg-[#FCFCFB] px-[14px] text-[12px] font-semibold uppercase tracking-[.06em]"
              style={{
                color: "#6E6E68",
                borderRight: "1px solid var(--shell-hairline-col)",
                borderBottom: "1px solid var(--shell-hairline-row)",
              }}
            >
              {resources.length > 0 ? resourceCountLabel : ""}
            </div>
            {days.map((day, i) => {
              const isToday = day.getTime() === today.getTime();
              const weekday = day.toLocaleDateString(intlLocale, { weekday: "short" });
              const dateNum = day.getDate();
              const isMonthStart = dateNum === 1;
              const monthShort = isMonthStart
                ? day.toLocaleDateString(intlLocale, { month: "short" })
                : null;
              return (
                <div
                  key={i}
                  className="flex min-h-[56px] flex-col justify-center gap-[2px] bg-[#FCFCFB] px-[14px] last:border-r-0"
                  style={{
                    borderRight: `1px solid var(--shell-hairline-col)`,
                    borderLeft: isMonthStart ? "1px solid var(--shell-hairline-month)" : undefined,
                    borderBottom: "1px solid var(--shell-hairline-row)",
                  }}
                >
                  <span
                    className="text-[11.5px] font-semibold uppercase tracking-[.06em]"
                    style={{ color: isToday ? "var(--accent)" : "#8A8A83" }}
                  >
                    {weekday}
                  </span>
                  <span className="flex items-baseline gap-[5px]">
                    <span
                      className="text-[20px] font-semibold tracking-[-0.02em]"
                      style={{ color: isToday ? "var(--accent)" : "var(--shell-ink-1)" }}
                    >
                      {dateNum}
                    </span>
                    {monthShort ? (
                      <span className="text-[12px]" style={{ color: "#8A8A83" }}>
                        {monthShort}
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>

          {resources.length === 0 ? (
            <p className="p-6 text-center text-[13.5px] text-[var(--ink-secondary)]">
              {grouping === "vehicle" ? t("noVehicles") : t("noDrivers")}
            </p>
          ) : (
            resources.map((resource, resourceIndex) => {
              const isLastResource = resourceIndex === resources.length - 1;
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

              const ResourceIcon = grouping === "vehicle" ? (resource.vehicleType === "VAN" ? Van : Bus) : UserRound;

              return (
                <div
                  key={resource.id}
                  className="grid"
                  style={{
                    gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
                    borderBottom: isLastResource ? undefined : "1px solid var(--shell-hairline-row)",
                  }}
                >
                  <div
                    className="sticky left-0 z-10 flex min-h-[128px] items-center gap-3 bg-white px-5 py-[18px]"
                    style={{ borderRight: "1px solid var(--shell-hairline-col)" }}
                  >
                    <span
                      className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px]"
                      style={{ background: "#F4F4F1" }}
                    >
                      <ResourceIcon size={18} strokeWidth={1.8} style={{ color: "#57574F" }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold" style={{ color: "var(--shell-ink-1)" }}>
                        {resource.name}
                      </p>
                      {resource.plate || resource.seats ? (
                        <p className="mt-[3px] flex min-w-0 items-center gap-[6px]">
                          {resource.plate ? (
                            <span
                              className="shrink-0 rounded-[5px] px-[6px] py-[1px] font-mono text-[11.5px] uppercase"
                              style={{ background: "#F4F4F1", color: "var(--shell-ink-secondary)" }}
                            >
                              {resource.plate}
                            </span>
                          ) : null}
                          {resource.seats ? (
                            <span className="truncate text-[12.5px]" style={{ color: "#6E6E68" }}>
                              {resource.seats} {tCarrier("fleetTable.seats")}
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div
                    className="relative col-span-7 grid"
                    style={{
                      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                      gridTemplateRows: `repeat(${laneCount}, minmax(128px, auto))`,
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
                      const isMonthStart = day.getDate() === 1;
                      return (
                        <div
                          key={i}
                          className={`last:border-r-0 ${
                            isDragTarget
                              ? dragOverTarget?.conflict
                                ? "bg-[var(--chip-critical)]/30"
                                : "bg-[var(--chip-positive)]/30"
                              : isToday
                                ? "bg-[var(--bg-today)]"
                                : "bg-white"
                          }`}
                          style={{
                            gridRow: "1 / -1",
                            gridColumn: i + 1,
                            borderRight: "1px solid var(--shell-hairline-col)",
                            borderLeft: isMonthStart ? "1px solid var(--shell-hairline-month)" : undefined,
                          }}
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
                          margin: "12px 8px",
                          background: "var(--status-blocked-bg)",
                          color: "var(--status-blocked-text-2)",
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
                          margin: "10px 6px",
                        }}
                      >
                        <RideBlockCard
                          ride={ride}
                          onClick={() => onRideClick(ride.id)}
                          style={{ height: "100%" }}
                          seats={seatsFor(ride)}
                          driverName={driverFor(ride)?.name}
                          driverId={driverFor(ride)?.id}
                          daySpan={endIdx - startIdx + 1}
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
                          background: "var(--ink-destructive)",
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
            className="flex h-12 w-full items-center gap-[6px] px-5 text-[13.5px] font-medium text-[var(--shell-ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[rgba(20,20,19,.03)]"
            style={{ borderTop: "1px solid var(--shell-hairline-row)" }}
          >
            <Plus size={14} strokeWidth={1.9} />
            {grouping === "vehicle" ? tCarrier("addVehicle") : tCarrier("addDriver")}
          </button>
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
