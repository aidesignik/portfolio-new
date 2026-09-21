import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import { AddDriverButton } from "@/components/forms/AddDriverButton";
import { driverExpiringItems, worstItemStatus } from "@/lib/expiryStatus";

export default async function DriversPage() {
  const [session, t, tType] = await Promise.all([
    auth(),
    getTranslations("carrier"),
    getTranslations("vehicleType"),
  ]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const [drivers, vehicles] = await Promise.all([
    prisma.driver.findMany({
      where: { carrierId: carrier.id },
      include: { vehicles: { include: { vehicle: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({ where: { carrierId: carrier.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("driversTitle")}</h1>
        <AddDriverButton vehicles={vehicles} />
      </div>

      {drivers.length === 0 ? (
        <p className="text-sm text-zinc-600">{t("noDrivers")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => {
            const expiryBadgeStatus = worstItemStatus(driverExpiringItems(driver, ""));
            return (
              <Link key={driver.id} href={`/carrier/drivers/${driver.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-900">{driver.name}</p>
                      <p className="text-sm text-zinc-600">{driver.phone}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {driver.vehicles.map((dv) => `${tType(dv.vehicle.type)} ${dv.vehicle.model}`).join(", ") ||
                          "-"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={driver.isAvailable ? "positive" : "neutral"}>
                        {driver.isAvailable ? "✓" : "—"}
                      </Badge>
                      {expiryBadgeStatus ? (
                        <Badge tone={expiryBadgeStatus === "expired" ? "negative" : "warning"}>
                          {t(`expiry.${expiryBadgeStatus}`)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
