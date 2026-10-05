"use client";

import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { RIDE_STATUS_BG, RIDE_STATUS_INK } from "./statusStyles";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import type { RideStatus } from "./types";

// Shared read-only detail body for the calendar ride card's hover/focus
// popover — same content for both the wide and compact card layouts.
export function RideCardDetailsPopover({
  route,
  clientLabel,
  status,
  time,
  passengerCount,
  seats,
  driverName,
  driverId,
}: {
  route: string;
  clientLabel: string;
  status: RideStatus;
  time: string;
  passengerCount: number;
  seats?: number | null;
  driverName?: string | null;
  driverId?: string | null;
}) {
  const t = useTranslations("carrier.calendar");
  const tDrivers = useTranslations("carrier.driversTable");

  const rows: { key: string; label: string; value: ReactNode }[] = [
    { key: "operator", label: t("detail.operator"), value: clientLabel },
    { key: "pickup", label: t("detail.pickup"), value: time },
    { key: "passengers", label: t("detail.passengers"), value: `${passengerCount}/${seats ?? "—"}` },
    {
      key: "driver",
      label: tDrivers("driver"),
      value: driverName ? (
        <span className="flex min-w-0 items-center gap-[6px]">
          <DriverAvatar id={driverId ?? undefined} name={driverName} size="xs" colorful />
          <span className="min-w-0 truncate">{driverName}</span>
        </span>
      ) : (
        t("detail.noDriver")
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-[10px]">
      <p className="truncate text-[14px] font-semibold text-[var(--ink-primary)]">{route}</p>
      <span
        className="inline-flex w-fit items-center rounded-full px-[8px] py-[2px] text-[11.5px] font-semibold"
        style={{ background: RIDE_STATUS_BG[status], color: RIDE_STATUS_INK[status] }}
      >
        {t(`legend.${status}`)}
      </span>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-[10px] gap-y-[6px] text-[12.5px]">
        {rows.map((row) => (
          <Fragment key={row.key}>
            <span className="text-[var(--ink-secondary)]">{row.label}</span>
            <span className="min-w-0 truncate text-[var(--ink-primary)]">{row.value}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
