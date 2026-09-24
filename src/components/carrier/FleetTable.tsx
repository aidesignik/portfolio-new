"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { VehicleAvatar } from "@/components/ui/VehicleAvatar";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { DocumentChipsRow } from "@/components/carrier/DocumentChipsRow";
import { RowActionsMenu } from "@/components/carrier/RowActionsMenu";
import { ClickableRow } from "@/components/carrier/ClickableRow";
import { StopClickPropagation } from "@/components/carrier/StopClickPropagation";
import { EditVehiclePanel } from "@/components/forms/EditVehiclePanel";
import { useRouter } from "@/i18n/navigation";
import { vehicleDocumentChips } from "@/lib/documentChips";

export interface FleetTableVehicle {
  id: string;
  type: string;
  model: string;
  licensePlate: string | null;
  year: number | null;
  seats: number;
  status: string;
  photos: string[];
  lastRegistrationDate: Date | null;
  lastInspectionDate: Date | null;
  drivers: { id: string; name: string }[];
}

const GRID = "grid-cols-[minmax(0,2.1fr)_120px_104px_minmax(0,1.9fr)_64px_40px]";
const EYEBROW = "text-[11px] font-bold uppercase tracking-[0.065em] text-[var(--ink-eyebrow)]";

export function FleetTable({ vehicles }: { vehicles: FleetTableVehicle[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  function onSaved() {
    setEditingVehicleId(null);
    router.refresh();
  }

  return (
    <div role="table" className="overflow-hidden rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-panel)]">
      <div
        role="row"
        className={`grid ${GRID} items-center gap-3 border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-3`}
      >
        <span role="columnheader" className={EYEBROW}>{t("carrier.fleetTable.vehicle")}</span>
        <span role="columnheader" className={EYEBROW}>{t("carrier.fleetTable.details")}</span>
        <span role="columnheader" className={EYEBROW}>{t("common.status")}</span>
        <span role="columnheader" className={EYEBROW}>{t("carrier.table.documents")}</span>
        <span role="columnheader" className={EYEBROW}>{t("carrier.fleetTable.assignedDriver")}</span>
        <span role="columnheader" className="sr-only">{t("common.actions")}</span>
      </div>
      <div role="rowgroup">
        {vehicles.map((vehicle) => {
          const chips = vehicleDocumentChips(vehicle);
          const typeLabel = t(`vehicleType.${vehicle.type}`);
          return (
            <ClickableRow
              key={vehicle.id}
              onClick={() => setEditingVehicleId(vehicle.id)}
              className={`grid ${GRID} items-center gap-3 border-b border-[var(--border-soft)] px-4 py-3.5 last:border-b-0`}
            >
              <div role="cell" className="flex min-w-0 items-center gap-[10px]">
                <VehicleAvatar type={vehicle.type} typeLabel={typeLabel} photoUrl={vehicle.photos[0] ?? null} />
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-bold text-[var(--ink-primary)]">
                    {typeLabel} {vehicle.model}
                  </p>
                  <p className="truncate font-mono text-[11.5px] text-[var(--ink-muted)]">
                    {vehicle.licensePlate ?? "—"}
                  </p>
                </div>
              </div>
              <div role="cell" className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] text-[var(--ink-secondary)]">
                {vehicle.year ? `${vehicle.year} · ` : ""}
                {vehicle.seats} {t("carrier.fleetTable.seats")}
              </div>
              <div role="cell" className="min-w-0">
                <Badge tone={vehicle.status === "ACTIVE" ? "positive" : "neutral"}>
                  {t(`vehicleStatus.${vehicle.status}`)}
                </Badge>
              </div>
              <div role="cell" className="min-w-0">
                <DocumentChipsRow chips={chips} t={t} />
              </div>
              <StopClickPropagation className="flex items-center gap-1">
                {vehicle.drivers.length === 0 ? (
                  <DriverAvatar empty size="sm" />
                ) : (
                  vehicle.drivers
                    .slice(0, 2)
                    .map((driver) => <DriverAvatar key={driver.id} id={driver.id} name={driver.name} size="sm" />)
                )}
              </StopClickPropagation>
              <StopClickPropagation className="flex justify-end">
                <RowActionsMenu
                  onEdit={() => setEditingVehicleId(vehicle.id)}
                  deleteUrl={`/api/carrier/vehicles/${vehicle.id}`}
                />
              </StopClickPropagation>
            </ClickableRow>
          );
        })}
      </div>

      {editingVehicleId ? (
        <EditVehiclePanel
          vehicleId={editingVehicleId}
          onClose={() => setEditingVehicleId(null)}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}
