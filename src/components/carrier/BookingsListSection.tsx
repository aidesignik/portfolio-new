"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BookingsTable } from "@/components/carrier/BookingsTable";
import { FilterDropdown } from "@/components/carrier/FilterDropdown";
import { displayRideStatus } from "@/lib/rideStatus";
import type { CalendarDriver, CalendarRide, CalendarVehicle, RideStatus } from "@/components/calendar/types";

const STATUSES: RideStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export function BookingsListSection({
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<string | null>(null);
  const [driverFilter, setDriverFilter] = useState<string | null>(null);

  const statusOptions = STATUSES.map((status) => ({ value: status, label: t(`carrier.calendar.legend.${status}`) }));
  const vehicleOptions = vehicles.map((v) => ({ value: v.id, label: `${t(`vehicleType.${v.type}`)} ${v.model}` }));
  const driverOptions = drivers.map((d) => ({ value: d.id, label: d.name }));

  const filtered = useMemo(
    () =>
      bookings.filter((booking) => {
        if (statusFilter && displayRideStatus(booking) !== statusFilter) return false;
        if (vehicleFilter && booking.vehicleId !== vehicleFilter) return false;
        if (driverFilter && booking.driverId !== driverFilter) return false;
        return true;
      }),
    [bookings, statusFilter, vehicleFilter, driverFilter],
  );

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <FilterDropdown label={t("common.status")} options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        <FilterDropdown
          label={t("carrier.bookingsTable.vehicle")}
          options={vehicleOptions}
          value={vehicleFilter}
          onChange={setVehicleFilter}
        />
        <FilterDropdown
          label={t("carrier.bookingsTable.driver")}
          options={driverOptions}
          value={driverFilter}
          onChange={setDriverFilter}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-[13.5px] text-[var(--ink-secondary)]">{t("carrier.table.noFilterResults")}</p>
      ) : (
        <BookingsTable bookings={filtered} vehicles={vehicles} drivers={drivers} initialSelectedId={initialSelectedId} />
      )}
    </>
  );
}
