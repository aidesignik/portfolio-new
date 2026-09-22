import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { DocumentDownloads } from "@/components/forms/DocumentDownloads";
import { formatRoute } from "@/lib/location";
import { clientDisplayName } from "@/lib/clientDisplay";

export default async function CarrierBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations()]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });

  const booking = await prisma.ride.findFirst({
    where: { id, carrierId: carrier.id },
    include: {
      client: { select: { name: true, companyName: true, phone: true, email: true } },
      vehicle: true,
      driver: true,
      documents: true,
    },
  });
  if (!booking || !booking.vehicle || !booking.driver) notFound();

  return (
    <div className="h-full space-y-6 overflow-y-auto bg-[var(--bg-canvas)] px-5 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{formatRoute(booking)}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {new Date(booking.departureAt).toLocaleString()} · {booking.passengerCount} pax
        </p>
      </div>

      <Card className="space-y-2">
        <p className="text-sm font-medium text-zinc-900">
          {clientDisplayName(booking.client)}
          {booking.client.companyName ? ` (${booking.client.name ?? "—"})` : ""}
        </p>
        <p className="text-sm text-zinc-600">{t("common.email")}: {booking.client.email}</p>
        <p className="text-sm text-zinc-600">{t("common.phone")}: {booking.client.phone}</p>
        <p className="text-sm text-zinc-600">
          {t(`vehicleType.${booking.vehicle.type}`)} {booking.vehicle.model} · {booking.driver.name}
        </p>
        <p className="text-lg font-semibold text-zinc-900">
          {Number(booking.price ?? 0).toLocaleString()} {booking.currency}
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-zinc-900">{t("documents.generateAll")}</h2>
        <DocumentDownloads bookingId={booking.id} initialDocuments={booking.documents} />
      </Card>
    </div>
  );
}
