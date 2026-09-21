import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { AddVehicleButton } from "@/components/forms/AddVehicleButton";
import { FleetTable } from "@/components/carrier/FleetTable";

export default async function FleetPage() {
  const [session, t] = await Promise.all([auth(), getTranslations()]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const vehicles = await prisma.vehicle.findMany({
    where: { carrierId: carrier.id },
    include: { drivers: { include: { driver: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("carrier.fleetTitle")}</h1>
        <AddVehicleButton />
      </div>

      {vehicles.length === 0 ? (
        <p className="text-sm text-zinc-600">{t("carrier.noVehicles")}</p>
      ) : (
        <FleetTable
          vehicles={vehicles.map((vehicle) => ({
            ...vehicle,
            drivers: vehicle.drivers.map((dv) => dv.driver),
          }))}
          t={t}
        />
      )}
    </div>
  );
}
