import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

export default async function FleetPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("carrier")]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });
  const vehicles = await prisma.vehicle.findMany({
    where: { carrierId: carrier.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("fleetTitle")}</h1>
        <Link href="/carrier/fleet/new">
          <Button>{t("addVehicle")}</Button>
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-sm text-zinc-600">{t("noVehicles")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/carrier/fleet/${vehicle.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {vehicle.year} · {vehicle.seats} seats
                    </p>
                  </div>
                  <Badge tone={vehicle.status === "ACTIVE" ? "positive" : "neutral"}>
                    {vehicle.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
