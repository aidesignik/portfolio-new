import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { AddDriverButton } from "@/components/forms/AddDriverButton";
import { DriversTable } from "@/components/carrier/DriversTable";

export default async function DriversPage() {
  const [session, t] = await Promise.all([auth(), getTranslations()]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const [drivers, vehicles] = await Promise.all([
    prisma.driver.findMany({
      where: { carrierId: carrier.id },
      include: {
        vehicles: { include: { vehicle: { select: { id: true, type: true, model: true, photos: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({ where: { carrierId: carrier.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("carrier.driversTitle")}</h1>
        <AddDriverButton vehicles={vehicles} />
      </div>

      {drivers.length === 0 ? (
        <p className="text-sm text-zinc-600">{t("carrier.noDrivers")}</p>
      ) : (
        <DriversTable
          drivers={drivers.map((driver) => ({
            ...driver,
            vehicles: driver.vehicles.map((dv) => dv.vehicle),
          }))}
          t={t}
        />
      )}
    </div>
  );
}
