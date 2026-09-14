import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { StatStrip } from "@/components/calendar/StatStrip";
import { RidesCalendar } from "@/components/calendar/RidesCalendar";

export default async function CarrierDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, session, t, tNav] = await Promise.all([
    params,
    auth(),
    getTranslations("carrier"),
    getTranslations("nav"),
  ]);
  // The (gated) layout already redirects to onboarding when the session has
  // no carrierId, but a freshly created session can reach this page before
  // that carrierId is reflected — fall back to the same redirect here
  // instead of crashing on a missing Carrier row.
  const carrier = await prisma.carrier.findUnique({ where: { userId: session!.user.id } });
  if (!carrier) {
    redirect(`/${locale}/carrier/onboarding`);
  }

  const [vehicleCount, driverCount, incomingCount, bookingCount] = await Promise.all([
    prisma.vehicle.count({ where: { carrierId: carrier.id } }),
    prisma.driver.count({ where: { carrierId: carrier.id } }),
    prisma.ride.count({ where: { carrierId: null, status: "PENDING" } }),
    prisma.ride.count({ where: { carrierId: carrier.id } }),
  ]);

  const tiles = [
    { href: "/carrier/requests", label: tNav("requests"), count: incomingCount },
    { href: "/carrier/fleet", label: tNav("fleet"), count: vehicleCount, addHref: "/carrier/fleet/new", addLabel: t("addVehicle") },
    { href: "/carrier/drivers", label: tNav("drivers"), count: driverCount, addHref: "/carrier/drivers/new", addLabel: t("addDriver") },
    { href: "/carrier/bookings", label: tNav("bookings"), count: bookingCount },
  ];

  const readyForCalendar = vehicleCount > 0 && driverCount > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("dashboardTitle")}</h1>
      <StatStrip tiles={tiles} />

      {readyForCalendar ? (
        <RidesCalendar />
      ) : (
        <Card className="space-y-4 text-center">
          <p className="text-sm text-zinc-600">
            {vehicleCount === 0 && driverCount === 0
              ? t("setupBothPrompt")
              : vehicleCount === 0
                ? t("setupVehiclePrompt")
                : t("setupDriverPrompt")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {vehicleCount === 0 ? (
              <Link href="/carrier/fleet/new">
                <Button>{t("addVehicle")}</Button>
              </Link>
            ) : null}
            {driverCount === 0 ? (
              <Link href="/carrier/drivers/new">
                <Button variant={vehicleCount === 0 ? "secondary" : "primary"}>{t("addDriver")}</Button>
              </Link>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}
