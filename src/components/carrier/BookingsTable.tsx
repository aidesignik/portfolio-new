"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatRoute } from "@/lib/location";
import { clientDisplayName } from "@/lib/clientDisplay";
import { ClickableRow } from "@/components/carrier/ClickableRow";
import { StatusDot } from "@/components/carrier/StatusDot";
import { RideDetailDrawer } from "@/components/calendar/RideDetailDrawer";
import { RIDE_STATUS_ACCENT } from "@/components/calendar/statusStyles";
import { displayRideStatus } from "@/lib/rideStatus";
import { usePathname, useRouter } from "@/i18n/navigation";
import { BOOKINGS_GRID_TEMPLATE } from "@/lib/tableLayout";
import type { CalendarDriver, CalendarRide, CalendarVehicle } from "@/components/calendar/types";

const HEADER_CLASS = "text-[13px] text-[var(--ink-secondary)]";

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function BookingsTable({
  bookings,
  vehicles,
  drivers,
  initialSelectedId = null,
}: {
  bookings: CalendarRide[];
  vehicles: CalendarVehicle[];
  drivers: CalendarDriver[];
  initialSelectedId?: string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const selected = bookings.find((b) => b.id === selectedId) ?? null;

  useEffect(() => {
    // Consume the one-time deep-link signal (e.g. a copied ride link, or
    // the sidebar's "Needs attention" list) so the side sheet opens
    // directly, then strip it from the URL — preserving the active tab
    // (?scope=) rather than dropping back to Upcoming.
    if (initialSelectedId) {
      const params = new URLSearchParams(searchParams);
      params.delete("edit");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChanged() {
    setSelectedId(null);
    router.refresh();
  }

  return (
    <div role="table" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[var(--border-container)] bg-white">
      <div
        role="row"
        className="grid h-11 shrink-0 items-center gap-3 border-b border-[var(--border-hairline)] px-5"
        style={{ gridTemplateColumns: BOOKINGS_GRID_TEMPLATE }}
      >
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.bookingsTable.route")}</span>
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.bookingsTable.dateTime")}</span>
        <span role="columnheader" className={`${HEADER_CLASS} text-right`}>{t("carrier.bookingsTable.passengers")}</span>
        <span role="columnheader" className={HEADER_CLASS}>{t("common.status")}</span>
      </div>
      <div role="rowgroup" className="min-h-0 flex-1 overflow-y-auto">
        {bookings.map((booking) => {
          const departure = new Date(booking.departureAt);
          const seats = vehicles.find((v) => v.id === booking.vehicleId)?.seats;
          const status = displayRideStatus(booking);
          return (
            <ClickableRow
              key={booking.id}
              onClick={() => setSelectedId(booking.id)}
              className="grid h-[68px] items-center gap-3 border-b border-[var(--border-hairline)] px-5 last:border-b-0"
              style={{ gridTemplateColumns: BOOKINGS_GRID_TEMPLATE }}
            >
              <div role="cell" className="min-w-0">
                <p className="truncate text-[14px] font-medium text-[var(--ink-primary)]">{formatRoute(booking)}</p>
                <p className="truncate text-[12.5px] text-[var(--ink-secondary)]">{clientDisplayName(booking.client)}</p>
              </div>
              <div role="cell" className="min-w-0">
                <p className="truncate text-[14px] font-medium text-[var(--ink-primary)]">{formatDate(departure)}</p>
                <p className="truncate text-[13px] text-[var(--ink-secondary)]">{formatTime(departure)}</p>
              </div>
              <div role="cell" className="min-w-0 text-right text-[14px] text-[var(--ink-primary)]">
                {booking.passengerCount}
                {seats ? <span className="text-[var(--ink-muted)]">/{seats}</span> : null}
              </div>
              <div role="cell" className="min-w-0">
                <StatusDot
                  color={RIDE_STATUS_ACCENT[status] ?? "#A1A1AA"}
                  label={t(`carrier.calendar.legend.${status}`)}
                />
              </div>
            </ClickableRow>
          );
        })}
      </div>

      {selected ? (
        <RideDetailDrawer
          ride={selected}
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setSelectedId(null)}
          onChanged={onChanged}
        />
      ) : null}
    </div>
  );
}
