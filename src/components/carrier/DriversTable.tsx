import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { VehicleAvatar } from "@/components/ui/VehicleAvatar";
import { DocumentChipsRow } from "@/components/carrier/DocumentChipsRow";
import { RowActionsMenu } from "@/components/carrier/RowActionsMenu";
import { ClickableRow } from "@/components/carrier/ClickableRow";
import { StopClickPropagation } from "@/components/carrier/StopClickPropagation";
import { driverDocumentChips } from "@/lib/documentChips";

type Translate = (key: string, values?: Record<string, string | number>) => string;

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

const GRID = "grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,1.5fr)_44px]";
const EYEBROW = "text-[11px] font-bold uppercase tracking-[0.065em] text-[var(--ink-eyebrow)]";

export function DriversTable({ drivers, t }: { drivers: DriversTableDriver[]; t: Translate }) {
  return (
    <div role="table" className="overflow-hidden rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-panel)]">
      <div
        role="row"
        className={`grid ${GRID} items-center gap-3 border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-3`}
      >
        <span role="columnheader" className={EYEBROW}>{t("carrier.driversTable.driver")}</span>
        <span role="columnheader" className={EYEBROW}>{t("carrier.driversTable.licenseNumber")}</span>
        <span role="columnheader" className={EYEBROW}>{t("carrier.driversTable.assignedVehicle")}</span>
        <span role="columnheader" className={EYEBROW}>{t("carrier.table.documents")}</span>
        <span role="columnheader" className="sr-only">{t("common.actions")}</span>
      </div>
      <div role="rowgroup">
        {drivers.map((driver) => {
          const chips = driverDocumentChips(driver);
          return (
            <ClickableRow
              key={driver.id}
              href={`/carrier/drivers/${driver.id}`}
              className={`grid ${GRID} items-center gap-3 border-b border-[var(--border-soft)] px-4 py-3.5 last:border-b-0`}
            >
              <div role="cell" className="flex min-w-0 items-center gap-[10px]">
                <DriverAvatar name={driver.name} id={driver.id} />
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-bold text-[var(--ink-primary)]">{driver.name}</p>
                  <p className="truncate font-mono text-[11.5px] text-[var(--ink-muted)]">{driver.phone}</p>
                </div>
              </div>
              <div role="cell" className="min-w-0 truncate font-mono text-[13.5px] text-[var(--ink-secondary)]">
                {driver.licenseNumber || "—"}
              </div>
              <div role="cell" className="min-w-0">
                {driver.vehicles.length === 0 ? (
                  <div className="flex items-center gap-[10px]">
                    <VehicleAvatar empty size="sm" />
                    <span className="truncate text-[13.5px] text-[var(--ink-disabled)]">
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
                <RowActionsMenu editHref={`/carrier/drivers/${driver.id}`} deleteUrl={`/api/carrier/drivers/${driver.id}`} />
              </StopClickPropagation>
            </ClickableRow>
          );
        })}
      </div>
    </div>
  );
}
