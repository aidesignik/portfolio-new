import { Badge } from "@/components/ui/Badge";
import { VehicleAvatar } from "@/components/ui/VehicleAvatar";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { AssignmentChip, EmptyAssignmentChip } from "@/components/ui/AssignmentChip";
import { DocumentChipsRow } from "@/components/carrier/DocumentChipsRow";
import { RowActionsMenu } from "@/components/carrier/RowActionsMenu";
import { vehicleDocumentChips } from "@/lib/documentChips";

type Translate = (key: string, values?: Record<string, string | number>) => string;

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

export function FleetTable({ vehicles, t }: { vehicles: FleetTableVehicle[]; t: Translate }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">{t("carrier.fleetTable.vehicle")}</th>
            <th className="px-4 py-3">{t("carrier.fleetTable.details")}</th>
            <th className="px-4 py-3">{t("common.status")}</th>
            <th className="px-4 py-3">{t("carrier.fleetTable.assignedDriver")}</th>
            <th className="px-4 py-3">{t("carrier.table.documents")}</th>
            <th className="px-4 py-3">
              <span className="sr-only">{t("common.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {vehicles.map((vehicle) => {
            const chips = vehicleDocumentChips(vehicle);
            return (
              <tr key={vehicle.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <VehicleAvatar type={vehicle.type} photoUrl={vehicle.photos[0] ?? null} />
                    <div>
                      <p className="font-medium text-zinc-900">
                        {t(`vehicleType.${vehicle.type}`)} {vehicle.model}
                      </p>
                      <p className="text-xs text-zinc-500">{vehicle.licensePlate ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {vehicle.year ? `${vehicle.year} · ` : ""}
                  {vehicle.seats} {t("carrier.fleetTable.seats")}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={vehicle.status === "ACTIVE" ? "positive" : "neutral"}>
                    {t(`vehicleStatus.${vehicle.status}`)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {vehicle.drivers.length === 0 ? (
                    <EmptyAssignmentChip>{t("carrier.assignment.noDriverAssigned")}</EmptyAssignmentChip>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {vehicle.drivers.map((driver) => (
                        <AssignmentChip key={driver.id}>
                          <DriverAvatar name={driver.name} size="sm" />
                          {driver.name}
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
                    editHref={`/carrier/fleet/${vehicle.id}`}
                    deleteUrl={`/api/carrier/vehicles/${vehicle.id}`}
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
