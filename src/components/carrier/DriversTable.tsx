import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { VehicleAvatar } from "@/components/ui/VehicleAvatar";
import { AssignmentChip, EmptyAssignmentChip } from "@/components/ui/AssignmentChip";
import { DocumentChipsRow } from "@/components/carrier/DocumentChipsRow";
import { RowActionsMenu } from "@/components/carrier/RowActionsMenu";
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

export function DriversTable({ drivers, t }: { drivers: DriversTableDriver[]; t: Translate }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">{t("carrier.driversTable.driver")}</th>
            <th className="px-4 py-3">{t("carrier.driversTable.licenseNumber")}</th>
            <th className="px-4 py-3">{t("carrier.driversTable.assignedVehicle")}</th>
            <th className="px-4 py-3">{t("carrier.table.documents")}</th>
            <th className="px-4 py-3">
              <span className="sr-only">{t("common.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {drivers.map((driver) => {
            const chips = driverDocumentChips(driver);
            return (
              <tr key={driver.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <DriverAvatar name={driver.name} />
                    <div>
                      <p className="font-medium text-zinc-900">{driver.name}</p>
                      <p className="text-xs text-zinc-500">{driver.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">{driver.licenseNumber || "—"}</td>
                <td className="px-4 py-3">
                  {driver.vehicles.length === 0 ? (
                    <EmptyAssignmentChip>{t("carrier.assignment.noVehicleAssigned")}</EmptyAssignmentChip>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {driver.vehicles.map((vehicle) => (
                        <AssignmentChip key={vehicle.id}>
                          <VehicleAvatar type={vehicle.type} photoUrl={vehicle.photos[0] ?? null} size="sm" />
                          {t(`vehicleType.${vehicle.type}`)} {vehicle.model}
                        </AssignmentChip>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <DocumentChipsRow chips={chips} t={t} />
                </td>
                <td className="px-4 py-3 text-right">
                  <RowActionsMenu
                    editHref={`/carrier/drivers/${driver.id}`}
                    deleteUrl={`/api/carrier/drivers/${driver.id}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
