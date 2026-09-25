"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { VehicleAvatar } from "@/components/ui/VehicleAvatar";
import { DocumentChipsRow } from "@/components/carrier/DocumentChipsRow";
import { RowActionsMenu } from "@/components/carrier/RowActionsMenu";
import { ClickableRow } from "@/components/carrier/ClickableRow";
import { StopClickPropagation } from "@/components/carrier/StopClickPropagation";
import { EditDriverPanel } from "@/components/forms/EditDriverPanel";
import { useRouter } from "@/i18n/navigation";
import { driverDocumentChips } from "@/lib/documentChips";
import { DRIVERS_GRID_TEMPLATE } from "@/lib/tableLayout";

export interface DriversTableDriver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string | null;
  idCardExpiry: Date | null;
  licenseExpiry: Date | null;
  cpcExpiry: Date | null;
  medicalCertExpiry: Date | null;
  vehicles: { id: string; type: string; model: string; photos: string[] }[];
}

const HEADER_CLASS = "text-[13px] text-[var(--ink-secondary)]";

export function DriversTable({
  drivers,
  vehicles,
}: {
  drivers: DriversTableDriver[];
  vehicles: { id: string; type: string; model: string }[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);

  function onSaved() {
    setEditingDriverId(null);
    router.refresh();
  }

  return (
    <div role="table" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[var(--border-container)] bg-white">
      <div
        role="row"
        className="grid h-11 shrink-0 items-center gap-3 border-b border-[var(--border-hairline)] px-5"
        style={{ gridTemplateColumns: DRIVERS_GRID_TEMPLATE }}
      >
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.driversTable.driver")}</span>
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.driversTable.licenseNumber")}</span>
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.driversTable.assignedVehicle")}</span>
        <span role="columnheader" className={HEADER_CLASS}>{t("carrier.table.documents")}</span>
        <span role="columnheader" className="sr-only">{t("common.actions")}</span>
      </div>
      <div role="rowgroup" className="min-h-0 flex-1 overflow-y-auto">
        {drivers.map((driver) => {
          const chips = driverDocumentChips(driver);
          return (
            <ClickableRow
              key={driver.id}
              onClick={() => setEditingDriverId(driver.id)}
              className="grid h-[68px] items-center gap-3 border-b border-[var(--border-hairline)] px-5 last:border-b-0"
              style={{ gridTemplateColumns: DRIVERS_GRID_TEMPLATE }}
            >
              <div role="cell" className="flex min-w-0 items-center gap-[10px]">
                <DriverAvatar name={driver.name} id={driver.id} />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[var(--ink-primary)]">{driver.name}</p>
                  <p className="truncate text-[12.5px] text-[var(--ink-secondary)]">{driver.phone}</p>
                </div>
              </div>
              <div role="cell" className="min-w-0 truncate font-mono text-[13px] text-[var(--ink-secondary)]">
                {driver.licenseNumber || "—"}
              </div>
              <div role="cell" className="min-w-0">
                {driver.vehicles.length === 0 ? (
                  <div className="flex items-center gap-[10px]">
                    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-[var(--border-strong)]" />
                    <span className="truncate text-[13.5px] font-medium text-[var(--action-bg)]">
                      {t("carrier.assignment.noVehicleAssigned")}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {driver.vehicles.slice(0, 2).map((vehicle) => (
                      <div key={vehicle.id} className="flex min-w-0 items-center gap-[10px]">
                        <VehicleAvatar
                          type={vehicle.type}
                          typeLabel={t(`vehicleType.${vehicle.type}`)}
                          photoUrl={vehicle.photos[0] ?? null}
                          size="sm"
                        />
                        <span className="truncate text-[13.5px] text-[var(--ink-secondary)]">
                          {t(`vehicleType.${vehicle.type}`)} {vehicle.model}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div role="cell" className="min-w-0">
                <DocumentChipsRow chips={chips} t={t} />
              </div>
              <StopClickPropagation className="flex justify-end">
                <RowActionsMenu
                  onEdit={() => setEditingDriverId(driver.id)}
                  deleteUrl={`/api/carrier/drivers/${driver.id}`}
                />
              </StopClickPropagation>
            </ClickableRow>
          );
        })}
      </div>

      {editingDriverId ? (
        <EditDriverPanel
          driverId={editingDriverId}
          vehicles={vehicles}
          onClose={() => setEditingDriverId(null)}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  );
}
