"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FleetTable, type FleetTableVehicle } from "@/components/carrier/FleetTable";
import { FilterDropdown } from "@/components/carrier/FilterDropdown";
import { vehicleDocumentChips, documentFilterStatus, type DocumentFilterStatus } from "@/lib/documentChips";

export function FleetListSection({
  vehicles,
  initialEditingId = null,
}: {
  vehicles: FleetTableVehicle[];
  initialEditingId?: string | null;
}) {
  const t = useTranslations();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [docFilter, setDocFilter] = useState<DocumentFilterStatus | null>(null);

  const statusOptions = [
    { value: "ACTIVE", label: t("vehicleStatus.ACTIVE") },
    { value: "INACTIVE", label: t("vehicleStatus.INACTIVE") },
  ];
  const docOptions = [
    { value: "valid", label: t("carrier.table.docFilterValid") },
    { value: "expiringSoon", label: t("carrier.table.docFilterExpiringSoon") },
    { value: "expired", label: t("carrier.table.docFilterExpired") },
    { value: "none", label: t("carrier.table.noDocuments") },
  ];

  const filtered = useMemo(
    () =>
      vehicles.filter((vehicle) => {
        if (statusFilter && vehicle.status !== statusFilter) return false;
        if (docFilter && documentFilterStatus(vehicleDocumentChips(vehicle)) !== docFilter) return false;
        return true;
      }),
    [vehicles, statusFilter, docFilter],
  );

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <FilterDropdown
          label={t("common.status")}
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
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
        <FleetTable vehicles={filtered} initialEditingId={initialEditingId} />
      )}
    </>
  );
}
