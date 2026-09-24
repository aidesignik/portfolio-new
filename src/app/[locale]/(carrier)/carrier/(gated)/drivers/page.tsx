import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { AddDriverButton } from "@/components/forms/AddDriverButton";
import { DriversTable } from "@/components/carrier/DriversTable";
import { PageHeader } from "@/components/carrier/PageHeader";

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
    <>
      <PageHeader
        title={t("carrier.driversTitle")}
        context={`${drivers.length}`}
        actions={<AddDriverButton vehicles={vehicles} />}
      />
      <div className="flex-1 overflow-y-auto bg-[var(--bg-canvas)] px-5 py-4">
        {drivers.length === 0 ? (
          <p className="text-[13.5px] text-[var(--ink-muted)]">{t("carrier.noDrivers")}</p>
        ) : (
          <DriversTable
            drivers={drivers.map((driver) => ({
              ...driver,
              vehicles: driver.vehicles.map((dv) => dv.vehicle),
            }))}
            vehicles={vehicles}
          />
        )}
      </div>
    </>
  );
}
