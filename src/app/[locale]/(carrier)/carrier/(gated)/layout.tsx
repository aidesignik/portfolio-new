import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import { CarrierSidebar } from "@/components/carrier/CarrierSidebar";

export default async function CarrierGatedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("carrierStatus");

  if (!session?.user.carrierId) {
    redirect(`/${locale}/carrier/onboarding`);
  }

  const status = session.user.carrierStatus;

  if (status && status !== "APPROVED") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Card>
          <p className="font-medium text-zinc-900">{t(status)}</p>
          <p className="mt-2 text-sm text-zinc-600">{t("pendingNotice")}</p>
          <Link
            href="/carrier/onboarding"
            className="mt-4 inline-block text-sm font-medium underline"
          >
            {t("PENDING")}
          </Link>
        </Card>
      </div>
    );
  }

  const carrierId = session.user.carrierId;
  const [requestCount, bookingCount, fleetCount, driverCount] = await Promise.all([
    prisma.ride.count({ where: { carrierId: null, status: "PENDING" } }),
    prisma.ride.count({ where: { carrierId } }),
    prisma.vehicle.count({ where: { carrierId } }),
    prisma.driver.count({ where: { carrierId } }),
  ]);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[1020px] grid-cols-[252px_1fr] overflow-hidden rounded-[18px] border border-[var(--border-hairline)] bg-[var(--bg-panel)]">
        <CarrierSidebar
          requestCount={requestCount}
          bookingCount={bookingCount}
          fleetCount={fleetCount}
          driverCount={driverCount}
        />
        <div className="flex min-w-0 flex-col bg-[var(--bg-canvas)]">{children}</div>
      </div>
    </div>
  );
}
