"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Bus, UserRound } from "lucide-react";
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

// Prev/next/date live in one bordered segmented control; the arrows get a
// hover tint only (no border of their own — the shared control draws it).
const WEEK_ARROW_CLASS =
  "flex h-full w-10 shrink-0 items-center justify-center text-[var(--shell-ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[rgba(20,20,19,.045)]";
const TODAY_BUTTON_CLASS =
  "flex h-10 shrink-0 items-center rounded-[10px] bg-[#F4F4F1] px-3 text-[13.5px] font-semibold text-[var(--shell-ink-1)] transition-colors duration-[.12s] ease-out hover:bg-[rgba(20,20,19,.07)]";

export function RidesCalendar() {
  const t = useTranslations("carrier.calendar");
  const locale = useLocale();
  // sr's default Intl formatting is Cyrillic; the rest of this app's
  // Serbian copy is Latin, matching the weekday/day-number formatting
  // ResourceTimelineGrid already uses.
  const intlLocale = locale === "sr" ? "sr-Latn" : "en";
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
    return <p className="text-[13.5px] text-[var(--ink-secondary)]">{t("loading")}</p>;
  }
  if (!data) {
    return <p className="text-[13.5px] text-[var(--ink-destructive)]">{t("loadError")}</p>;
  }

  const weekEnd = new Date(weekStart.getTime() + 6 * DAY_MS);
  const fmtDay = (d: Date) => new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" }).format(d);
  const weekLabel = `${fmtDay(weekStart)} – ${fmtDay(weekEnd)} ${weekEnd.getFullYear()}`;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] bg-[var(--surface-card-bg)]"
      style={{ boxShadow: "var(--shadow-calendar-card)" }}
    >
      <div
        className="flex flex-wrap items-center gap-2 px-4 py-[14px]"
        style={{ borderBottom: "1px solid var(--shell-hairline-row)" }}
      >
        <div
          className="flex h-10 shrink-0 items-center overflow-hidden rounded-[10px]"
          style={{ boxShadow: "var(--ring-2)" }}
        >
          <button
            type="button"
            onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * DAY_MS))}
            aria-label={t("previousWeek")}
            className={WEEK_ARROW_CLASS}
          >
            <ChevronLeft size={16} strokeWidth={1.9} />
          </button>
          <span
            className="flex h-full items-center whitespace-nowrap px-3 text-[14.5px] font-semibold text-[var(--shell-ink-1)]"
            style={{ borderLeft: "1px solid var(--shell-hairline-row)", borderRight: "1px solid var(--shell-hairline-row)" }}
          >
            {weekLabel}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * DAY_MS))}
            aria-label={t("nextWeek")}
            className={WEEK_ARROW_CLASS}
          >
            <ChevronRight size={16} strokeWidth={1.9} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setWeekStart(startOfWeek(new Date()))}
          className={`ml-1 ${TODAY_BUTTON_CLASS}`}
        >
          {t("today")}
        </button>

        <div className="ml-auto">
          <CalendarLegend />
        </div>

        <div className="ml-4 flex shrink-0 items-center gap-[3px] rounded-[10px] bg-[#F4F4F1] p-[3px]">
          <button
            type="button"
            onClick={() => setGrouping("vehicle")}
            aria-pressed={grouping === "vehicle"}
            className={`flex h-[40px] items-center gap-[6px] rounded-[7px] px-[10px] text-[13.5px] transition-[background-color,box-shadow,color] duration-[.12s] ease-out ${
              grouping === "vehicle"
                ? "bg-white font-semibold text-[var(--shell-ink-1)] shadow-[var(--ring-1)]"
                : "font-medium text-[#6E6E68] hover:text-[var(--shell-ink-1)]"
            }`}
          >
            <Bus size={14} strokeWidth={1.9} />
            {t("byVehicle")}
          </button>
          <button
            type="button"
            onClick={() => setGrouping("driver")}
            aria-pressed={grouping === "driver"}
            className={`flex h-[40px] items-center gap-[6px] rounded-[7px] px-[10px] text-[13.5px] transition-[background-color,box-shadow,color] duration-[.12s] ease-out ${
              grouping === "driver"
                ? "bg-white font-semibold text-[var(--shell-ink-1)] shadow-[var(--ring-1)]"
                : "font-medium text-[#6E6E68] hover:text-[var(--shell-ink-1)]"
            }`}
          >
            <UserRound size={14} strokeWidth={1.9} />
            {t("byDriver")}
          </button>
        </div>
      </div>

      {/* The single scroll container for both axes — a sticky header (top)
          and a sticky resource column (left) both need to resolve against
          the SAME scrolling ancestor. Splitting x/y across nested divs
          doesn't work: a div with only overflow-x set has its overflow-y
          computed as auto too (CSS overflow rules), which makes it its own
          (never-scrolling) "scroll box" and breaks sticky-to-the-real-
          scroller for anything inside it. */}
      <div className="min-h-0 flex-1 overflow-auto">
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
          onResourceAdded={load}
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
