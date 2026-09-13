import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { DocumentDownloads } from "@/components/forms/DocumentDownloads";
import { formatRoute } from "@/lib/location";

export default async function ClientBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations()]);

  const booking = await prisma.booking.findFirst({
    where: { id, clientId: session!.user.id },
    include: { carrier: true, vehicle: true, driver: true, request: true, documents: true },
  });
  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{formatRoute(booking.request)}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {new Date(booking.request.departureAt).toLocaleString()} · {booking.request.passengerCount} pax
        </p>
      </div>

      <Card className="space-y-2">
        <p className="text-sm text-zinc-600">{booking.carrier.companyName}</p>
        <p className="text-sm text-zinc-600">
          {t(`vehicleType.${booking.vehicle.type}`)} {booking.vehicle.model} · {booking.driver.name}
        </p>
        <p className="text-lg font-semibold text-zinc-900">
          {Number(booking.price).toLocaleString()} {booking.currency}
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-zinc-900">{t("documents.generateAll")}</h2>
        <DocumentDownloads bookingId={booking.id} initialDocuments={booking.documents} />
      </Card>
    </div>
  );
}
