"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MoreVertical } from "lucide-react";
import { formatLocation } from "@/lib/location";
import { clientDisplayName } from "@/lib/clientDisplay";
import { ClickableRow } from "@/components/carrier/ClickableRow";
import { StopClickPropagation } from "@/components/carrier/StopClickPropagation";
import { VehicleAvatar } from "@/components/ui/VehicleAvatar";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { RideDetailDrawer } from "@/components/calendar/RideDetailDrawer";
import { RIDE_STATUS_BG, RIDE_STATUS_DOT } from "@/components/calendar/statusStyles";
import { displayRideStatus } from "@/lib/rideStatus";
import { usePathname, useRouter } from "@/i18n/navigation";
import { BOOKINGS_GRID_TEMPLATE } from "@/lib/tableLayout";
import type { CalendarDriver, CalendarRide, CalendarVehicle } from "@/components/calendar/types";

const HEADER_CLASS = "text-[12px] font-semibold text-[#8E8E93]";

// A single "open" item — bookings don't support outright deletion (a ride
// is cancelled, never destroyed), so this isn't RowActionsMenu's
// edit/delete pair, just a kebab that matches its look and opens the same
// detail drawer a row click does.
function BookingRowActionsMenu({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-[9px] p-2 text-[#A9A9B2] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
        aria-label={t("actions")}
      >
        <MoreVertical size={16} strokeWidth={1.9} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-[60] mt-1 w-36 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-panel)] py-1 shadow-[var(--shadow-card)]">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpen();
              }}
              className="block h-9 w-full px-3 text-left text-[14px] leading-9 text-[var(--ink-2)] hover:bg-[var(--border-soft)]"
            >
              {t("open")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
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
  const locale = useLocale();
  // sr's default Intl formatting is Cyrillic; the rest of this app's
  // Serbian copy is Latin, matching the calendar's own convention.
  const intlLocale = locale === "sr" ? "sr-Latn" : "en";
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
    <div role="table" className="flex flex-col overflow-hidden rounded-[12px] border border-[#EDEDED] bg-white">
      <div
        role="row"
        className="grid items-center gap-3 border-b border-[#EDEDED] px-4 py-[10px]"
        style={{ gridTemplateColumns: BOOKINGS_GRID_TEMPLATE }}
      >
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.bookingsTable.route")}</span>
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.bookingsTable.dateTime")}</span>
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.bookingsTable.vehicle")}</span>
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.bookingsTable.driver")}</span>
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.bookingsTable.passengers")}</span>
        <span role="columnheader" className={HEADER_CLASS}>{t("common.status")}</span>
        <span role="columnheader" className="sr-only">{t("common.actions")}</span>
      </div>
      <div role="rowgroup">
        {bookings.map((booking, i) => {
          const departure = new Date(booking.departureAt);
          const dayNum = departure.getDate();
          const monthAbbr = new Intl.DateTimeFormat(intlLocale, { month: "short" }).format(departure).toUpperCase();
          const weekday = departure.toLocaleDateString(intlLocale, { weekday: "short" });
          const dayMonth = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" }).format(departure);
          const time = departure.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

          const vehicle = vehicles.find((v) => v.id === booking.vehicleId) ?? null;
          const driver = drivers.find((d) => d.id === booking.driverId) ?? null;
          const seats = vehicle?.seats ?? null;
          const overCapacity = seats !== null && booking.passengerCount > seats;
          const capacityPct = seats ? Math.min(100, Math.round((booking.passengerCount / seats) * 100)) : 0;

          const status = displayRideStatus(booking);
          const isLast = i === bookings.length - 1;

          return (
            <ClickableRow
              key={booking.id}
              onClick={() => setSelectedId(booking.id)}
              className={`grid items-center gap-3 px-4 py-3 transition-colors duration-[.12s] ease-out hover:bg-[#FAFAFA] ${
                isLast ? "" : "border-b border-[#F3F3F3]"
              }`}
              style={{ gridTemplateColumns: BOOKINGS_GRID_TEMPLATE }}
            >
              <div role="cell" className="flex min-w-0 items-center gap-[10px]">
                <div
                  className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] bg-white"
                  style={{ boxShadow: "inset 0 0 0 1px var(--border-control)" }}
                >
                  <span className="text-[16px] font-semibold leading-none text-[var(--ink-primary)]">{dayNum}</span>
                  <span className="mt-[3px] text-[11px] uppercase leading-none text-[var(--ink-muted)]">{monthAbbr}</span>
                </div>
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-[6px] text-[14.5px] font-semibold text-[var(--ink-primary)]">
                    <span className="truncate">
                      {booking.pickupCity} → {booking.destinationCity}
                    </span>
                    {booking.stops.length > 0 ? (
                      <span
                        className="shrink-0 rounded-[6px] px-[6px] py-[2px] text-[11px] font-medium"
                        style={{ background: "#F3F3F3", color: "#55555C" }}
                      >
                        {t("carrier.bookingsTable.extraStops", { count: booking.stops.length })}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-[12.5px] text-[var(--ink-secondary)]">
                    {clientDisplayName(booking.client)} · {formatLocation({ city: booking.pickupCity, location: booking.pickupLocation })} →{" "}
                    {formatLocation({ city: booking.destinationCity, location: booking.destinationLocation })}
                  </p>
                </div>
              </div>

              <div role="cell" className="min-w-0 truncate text-[13.5px] font-medium text-[var(--ink-primary)]">
                {weekday} {dayMonth} · {time}
              </div>

              <div role="cell" className="min-w-0">
                {vehicle ? (
                  <div className="flex min-w-0 items-center gap-[8px]">
                    <VehicleAvatar
                      type={vehicle.type}
                      typeLabel={t(`vehicleType.${vehicle.type}`)}
                      photoUrl={vehicle.photos[0] ?? null}
                      size="xs"
                    />
                    <span className="truncate text-[13px] text-[#27272B]">
                      {t(`vehicleType.${vehicle.type}`)} {vehicle.model}
                    </span>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-[8px]">
                    <VehicleAvatar empty size="xs" />
                    <span className="truncate text-[13px] text-[#8E8E93]">{t("carrier.bookingsTable.noneAssigned")}</span>
                  </div>
                )}
              </div>

              <div role="cell" className="min-w-0">
                {driver ? (
                  <div className="flex min-w-0 items-center gap-[8px]">
                    <DriverAvatar driver={driver} size={24} decorative />
                    <span className="truncate text-[13px] text-[#27272B]">{driver.name}</span>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-[8px]">
                    <DriverAvatar driver={null} size={24} />
                    <span className="truncate text-[13px] text-[#8E8E93]">{t("carrier.bookingsTable.noneAssigned")}</span>
                  </div>
                )}
              </div>

              <div
                role="cell"
                className="flex min-w-0 items-center gap-[6px]"
                title={overCapacity ? t("carrier.bookingsTable.overCapacity") : undefined}
              >
                <span className="shrink-0 text-[13.5px] font-medium" style={{ color: overCapacity ? "#B4232F" : "var(--ink-primary)" }}>
                  {booking.passengerCount}
                  {seats ? (
                    <span style={{ color: overCapacity ? "#B4232F" : "var(--ink-muted)" }}>/{seats}</span>
                  ) : null}
                </span>
                {seats ? (
                  <span
                    className="h-[4px] w-[32px] shrink-0 overflow-hidden rounded-full"
                    style={{ background: overCapacity ? "rgba(180,35,47,.18)" : "var(--border-soft)" }}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${capacityPct}%`, background: overCapacity ? "#B4232F" : "var(--ink-secondary)" }}
                    />
                  </span>
                ) : null}
              </div>

              <div role="cell" className="min-w-0">
                <span
                  className="inline-flex items-center gap-[6px] whitespace-nowrap rounded-full px-[10px] py-[4px] text-[12px] font-semibold"
                  style={{ background: RIDE_STATUS_BG[status], color: RIDE_STATUS_DOT[status] }}
                >
                  <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: RIDE_STATUS_DOT[status] }} />
                  {t(`carrier.calendar.legend.${status}`)}
                </span>
              </div>

              <StopClickPropagation className="flex items-center justify-center">
                <BookingRowActionsMenu onOpen={() => setSelectedId(booking.id)} />
              </StopClickPropagation>
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
