"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DriversTable, type DriversTableDriver } from "@/components/carrier/DriversTable";
import { FilterDropdown } from "@/components/carrier/FilterDropdown";
import { driverDocumentChips, documentFilterStatus, type DocumentFilterStatus } from "@/lib/documentChips";

const UNASSIGNED = "__unassigned__";

export function DriversListSection({
  drivers,
  vehicles,
  initialEditingId = null,
}: {
  drivers: DriversTableDriver[];
  vehicles: { id: string; type: string; model: string }[];
  initialEditingId?: string | null;
}) {
  const t = useTranslations();
  const [vehicleFilter, setVehicleFilter] = useState<string | null>(null);
  const [docFilter, setDocFilter] = useState<DocumentFilterStatus | null>(null);

  const vehicleOptions = [
    { value: UNASSIGNED, label: t("carrier.driversTable.noVehicle") },
    ...vehicles.map((v) => ({ value: v.id, label: `${t(`vehicleType.${v.type}`)} ${v.model}` })),
  ];
  const docOptions = [
    { value: "valid", label: t("carrier.table.docFilterValid") },
    { value: "expiringSoon", label: t("carrier.table.docFilterExpiringSoon") },
    { value: "expired", label: t("carrier.table.docFilterExpired") },
    { value: "none", label: t("carrier.table.noDocuments") },
  ];

  const filtered = useMemo(
    () =>
      drivers.filter((driver) => {
        if (vehicleFilter === UNASSIGNED && driver.vehicles.length > 0) return false;
        if (vehicleFilter && vehicleFilter !== UNASSIGNED && !driver.vehicles.some((v) => v.id === vehicleFilter))
          return false;
        if (docFilter && documentFilterStatus(driverDocumentChips(driver)) !== docFilter) return false;
        return true;
      }),
    [drivers, vehicleFilter, docFilter],
  );

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <FilterDropdown
          label={t("carrier.driversTable.assignedVehicle")}
          options={vehicleOptions}
          value={vehicleFilter}
          onChange={setVehicleFilter}
        />
        <FilterDropdown
          label={t("carrier.table.documents")}
          options={docOptions}
          value={docFilter}
          onChange={(v) => setDocFilter(v as DocumentFilterStatus | null)}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-[13.5px] text-[var(--ink-secondary)]">{t("carrier.table.noFilterResults")}</p>
      ) : (
        <DriversTable drivers={filtered} vehicles={vehicles} initialEditingId={initialEditingId} />
      )}
    </>
  );
}
