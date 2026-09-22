import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { AddVehicleButton } from "@/components/forms/AddVehicleButton";
import { FleetTable } from "@/components/carrier/FleetTable";
import { PageHeader } from "@/components/carrier/PageHeader";

export default async function FleetPage() {
  const [session, t] = await Promise.all([auth(), getTranslations()]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const vehicles = await prisma.vehicle.findMany({
    where: { carrierId: carrier.id },
    include: { drivers: { include: { driver: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title={t("carrier.fleetTitle")}
        context={`${vehicles.length}`}
        actions={<AddVehicleButton />}
      />
      <div className="flex-1 overflow-y-auto bg-[var(--bg-canvas)] px-5 py-4">
        {vehicles.length === 0 ? (
          <p className="text-[13.5px] text-[var(--ink-muted)]">{t("carrier.noVehicles")}</p>
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
    </>
  );
}
