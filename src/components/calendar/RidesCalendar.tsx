"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ResourceTimelineGrid, type DragOverTarget } from "./ResourceTimelineGrid";
import { UnassignedQueue } from "./UnassignedQueue";
import { CalendarLegend } from "./CalendarLegend";
import { NewRideModal } from "./NewRideModal";
import { RideDetailDrawer } from "./RideDetailDrawer";
import type { CalendarData, CalendarRide, ResourceGrouping } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const AVERAGE_TRIP_DURATION_HOURS = 4;

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  // Monday-start week
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function rideWindow(ride: Pick<CalendarRide, "departureAt" | "returnAt">) {
  const start = new Date(ride.departureAt);
  const end = ride.returnAt
    ? new Date(ride.returnAt)
    : new Date(start.getTime() + AVERAGE_TRIP_DURATION_HOURS * 60 * 60 * 1000);
  return { start, end };
}

function windowsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  const pad = 3 * 60 * 60 * 1000;
  return aStart.getTime() - pad <= bEnd.getTime() && aEnd.getTime() + pad >= bStart.getTime();
}

export function RidesCalendar() {
  const t = useTranslations("carrier.calendar");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [grouping, setGrouping] = useState<ResourceGrouping>("vehicle");
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewRide, setShowNewRide] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [draggingRideId, setDraggingRideId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/carrier/calendar?weekStart=${weekStart.toISOString()}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        console.error("Failed to load calendar", res.status, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.error("Failed to load calendar", err);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    // Standard fetch-on-mount/on-dependency-change — load() only touches
    // state after its await resolves. No data-fetching library elsewhere
    // in this app to reach for instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const allRides = useMemo(() => (data ? [...data.rides, ...data.unassigned] : []), [data]);
  const draggingRide = draggingRideId ? allRides.find((r) => r.id === draggingRideId) ?? null : null;
  const selectedRide = selectedRideId ? allRides.find((r) => r.id === selectedRideId) ?? null : null;

  function handleDragOverResource(resourceId: string) {
    if (!draggingRide || !data) return;
    const { start, end } = rideWindow(draggingRide);

    const resourceRides = data.rides.filter(
      (r) => r.id !== draggingRide.id && (grouping === "vehicle" ? r.vehicleId : r.driverId) === resourceId,
    );
    const conflictRide = resourceRides.find((r) => {
      const w = rideWindow(r);
      return windowsOverlap(start, end, w.start, w.end);
    });
    if (conflictRide) {
      setDragOverTarget({
        resourceId,
        conflict: true,
        message: t("conflictWith", { client: conflictRide.client.name ?? "—" }),
      });
      return;
    }

    const resourceBlocks = data.blocks.filter(
      (b) => (grouping === "vehicle" ? b.vehicleId : b.driverId) === resourceId,
    );
    const conflictBlock = resourceBlocks.find((b) =>
      windowsOverlap(start, end, new Date(b.startAt), new Date(b.endAt)),
    );
    if (conflictBlock) {
      setDragOverTarget({ resourceId, conflict: true, message: t("conflictBlocked") });
      return;
    }

    setDragOverTarget({ resourceId, conflict: false });
  }

  async function handleDrop(resourceId: string) {
    if (!draggingRide) return;
    if (dragOverTarget?.conflict) {
      setDraggingRideId(null);
      setDragOverTarget(null);
      return;
    }

    const body = grouping === "vehicle" ? { vehicleId: resourceId } : { driverId: resourceId };
    setDraggingRideId(null);
    setDragOverTarget(null);
    const res = await fetch(`/api/carrier/rides/${draggingRide.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) load();
  }

  if (loading && !data) {
    return <p className="text-sm text-zinc-600">{t("loading")}</p>;
  }
  if (!data) {
    return <p className="text-sm text-red-600">{t("loadError")}</p>;
  }

  const weekLabel = `${weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${new Date(
    weekStart.getTime() + 6 * DAY_MS,
  ).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * DAY_MS))}>
            ←
          </Button>
          <span className="min-w-[10rem] text-center text-sm font-medium text-zinc-900">{weekLabel}</span>
          <Button variant="secondary" onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * DAY_MS))}>
            →
          </Button>
          <Button variant="ghost" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            {t("today")}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-zinc-300 p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setGrouping("vehicle")}
              className={`rounded px-3 py-1 ${grouping === "vehicle" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
            >
              {t("byVehicle")}
            </button>
            <button
              type="button"
              onClick={() => setGrouping("driver")}
              className={`rounded px-3 py-1 ${grouping === "driver" ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
            >
              {t("byDriver")}
            </button>
          </div>
          <Button onClick={() => setShowNewRide(true)}>+ {t("newRide")}</Button>
        </div>
      </div>

      <CalendarLegend />

      <div className={`grid gap-4 ${data.unassigned.length > 0 ? "lg:grid-cols-[1fr_20rem]" : ""}`}>
        <ResourceTimelineGrid
          weekStart={weekStart}
          grouping={grouping}
          vehicles={data.vehicles}
          drivers={data.drivers}
          rides={data.rides}
          blocks={data.blocks}
          onRideClick={setSelectedRideId}
          onDropRide={handleDrop}
          dragOverTarget={dragOverTarget}
          onDragOverResource={handleDragOverResource}
          onDragLeave={() => setDragOverTarget(null)}
          draggingRideId={draggingRideId}
        />
        {data.unassigned.length > 0 ? (
          <UnassignedQueue
            rides={data.unassigned}
            onDragStart={setDraggingRideId}
            onDragEnd={() => {
              setDraggingRideId(null);
              setDragOverTarget(null);
            }}
            onRideClick={setSelectedRideId}
          />
        ) : null}
      </div>

      {showNewRide ? (
        <NewRideModal
          onClose={() => setShowNewRide(false)}
          onCreated={() => {
            setShowNewRide(false);
            load();
          }}
        />
      ) : null}

      {selectedRide ? (
        <RideDetailDrawer
          ride={selectedRide}
          vehicles={data.vehicles}
          drivers={data.drivers}
          onClose={() => setSelectedRideId(null)}
          onChanged={() => {
            setSelectedRideId(null);
            load();
          }}
        />
      ) : null}
    </div>
  );
}
