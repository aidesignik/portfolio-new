"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ResourceTimelineGrid, type DragOverTarget } from "./ResourceTimelineGrid";
import { UnassignedQueue } from "./UnassignedQueue";
import { CalendarLegend } from "./CalendarLegend";
import { NewRideModal } from "./NewRideModal";
import { RideDetailDrawer } from "./RideDetailDrawer";
import { useNewRide } from "./NewRideContext";
import { fetchWithAvailabilityConfirm } from "@/lib/availabilityConfirm";
import { clientDisplayName } from "@/lib/clientDisplay";
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
  const { showNewRide, closeNewRide } = useNewRide();
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
        message: t("conflictWith", { client: clientDisplayName(conflictRide.client) }),
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
    const body = grouping === "vehicle" ? { vehicleId: resourceId } : { driverId: resourceId };
    setDraggingRideId(null);
    setDragOverTarget(null);
    // The red highlight while dragging is just a live preview — dropping
    // still goes through, and a real conflict is confirmed (not blocked)
    // via the server's advisory check.
    const { response } = await fetchWithAvailabilityConfirm(
      `/api/carrier/rides/${draggingRide.id}/assign`,
      "POST",
      body,
      (start, end) => t("availabilityWarning", { start, end }),
    );
    if (response.ok) load();
  }

  if (loading && !data) {
    return <p className="text-[13.5px] text-[var(--ink-disabled)]">{t("loading")}</p>;
  }
  if (!data) {
    return <p className="text-[13.5px] text-[#7F1D1D]">{t("loadError")}</p>;
  }

  const weekLabel = `${weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${new Date(
    weekStart.getTime() + 6 * DAY_MS,
  ).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * DAY_MS))}
            aria-label={t("today")}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg-panel)] text-[var(--ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--bg-subtle)]"
          >
            <ChevronLeft size={17} strokeWidth={1.9} />
          </button>
          <span className="min-w-[10rem] text-center font-mono text-[13.5px] font-medium text-[var(--ink-2)]">
            {weekLabel}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * DAY_MS))}
            aria-label={t("today")}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg-panel)] text-[var(--ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--bg-subtle)]"
          >
            <ChevronRight size={17} strokeWidth={1.9} />
          </button>
          <Button variant="secondary" compact onClick={() => setWeekStart(startOfWeek(new Date()))}>
            {t("today")}
          </Button>
        </div>

        <div className="flex items-center gap-[2px] rounded-[10px] bg-[var(--border-soft)] p-[3px]">
          <button
            type="button"
            onClick={() => setGrouping("vehicle")}
            className={`rounded-[7px] px-3 py-[6px] text-[14px] font-semibold transition-[background-color,box-shadow] duration-[.12s] ease-out ${
              grouping === "vehicle"
                ? "bg-[var(--bg-panel)] text-[var(--ink-primary)] shadow-[0_1px_2px_rgba(24,24,27,.08)]"
                : "text-[var(--ink-secondary)]"
            }`}
          >
            {t("byVehicle")}
          </button>
          <button
            type="button"
            onClick={() => setGrouping("driver")}
            className={`rounded-[7px] px-3 py-[6px] text-[14px] font-semibold transition-[background-color,box-shadow] duration-[.12s] ease-out ${
              grouping === "driver"
                ? "bg-[var(--bg-panel)] text-[var(--ink-primary)] shadow-[0_1px_2px_rgba(24,24,27,.08)]"
                : "text-[var(--ink-secondary)]"
            }`}
          >
            {t("byDriver")}
          </button>
        </div>
      </div>

      <CalendarLegend />

      <div className="overflow-hidden rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-panel)]">
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
          onClose={closeNewRide}
          onCreated={() => {
            closeNewRide();
            load();
          }}
          onDepartureDateChange={(date) => setWeekStart(startOfWeek(date))}
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
