import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";

export default async function CarrierDashboardPage() {
  const [session, t, tNav] = await Promise.all([
    auth(),
    getTranslations("carrier"),
    getTranslations("nav"),
  ]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });

  const [vehicleCount, driverCount, incomingCount, bookingCount] = await Promise.all([
    prisma.vehicle.count({ where: { carrierId: carrier.id } }),
    prisma.driver.count({ where: { carrierId: carrier.id } }),
    prisma.bookingRequest.count({ where: { status: { in: ["PENDING", "OFFERED"] } } }),
    prisma.booking.count({ where: { carrierId: carrier.id } }),
  ]);

  const tiles = [
    { href: "/carrier/requests", label: tNav("requests"), count: incomingCount },
    { href: "/carrier/fleet", label: tNav("fleet"), count: vehicleCount },
    { href: "/carrier/drivers", label: tNav("drivers"), count: driverCount },
    { href: "/carrier/bookings", label: tNav("bookings"), count: bookingCount },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("dashboardTitle")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href}>
            <Card className="transition-shadow hover:shadow-md">
              <p className="text-sm text-zinc-600">{tile.label}</p>
              <p className="mt-1 text-3xl font-semibold text-zinc-900">{tile.count}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
