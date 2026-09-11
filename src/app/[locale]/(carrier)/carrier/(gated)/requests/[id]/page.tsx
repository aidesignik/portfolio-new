import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { OfferForm } from "@/components/forms/OfferForm";
import { formatLocation } from "@/lib/location";

export default async function CarrierRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations()]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });

  const [bookingRequest, vehicles, drivers] = await Promise.all([
    prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        client: { select: { name: true, phone: true } },
        stops: { orderBy: { order: "asc" } },
      },
    }),
    prisma.vehicle.findMany({ where: { carrierId: carrier.id, status: "ACTIVE" } }),
    prisma.driver.findMany({ where: { carrierId: carrier.id, isAvailable: true } }),
  ]);

  if (!bookingRequest) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {formatLocation({ city: bookingRequest.pickupCity, location: bookingRequest.pickupLocation })}
        </h1>
        {bookingRequest.stops.length > 0 ? (
          <div className="mt-1 space-y-0.5">
            {bookingRequest.stops.map((stop) => (
              <p key={stop.id} className="text-sm text-zinc-500">
                ↓ {formatLocation(stop)}
              </p>
            ))}
          </div>
        ) : null}
        <p className="mt-1 text-lg font-semibold text-zinc-900">
          →{" "}
          {formatLocation({
            city: bookingRequest.destinationCity,
            location: bookingRequest.destinationLocation,
          })}
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          {new Date(bookingRequest.departureAt).toLocaleString()} · {bookingRequest.passengerCount} pax
        </p>
        {bookingRequest.isRoundTrip && bookingRequest.returnAt ? (
          <p className="text-sm font-medium text-amber-700">
            {t("client.requestForm.isRoundTrip")} — {t("client.requestForm.returnAt")}:{" "}
            {new Date(bookingRequest.returnAt).toLocaleString()}
          </p>
        ) : null}
        <p className="text-sm text-zinc-600">
          {bookingRequest.client.name} · {bookingRequest.client.phone}
        </p>
        {bookingRequest.specialRequests ? (
          <p className="mt-2 text-sm text-zinc-700">{bookingRequest.specialRequests}</p>
        ) : null}
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-zinc-900">{t("carrier.offerForm.title")}</h2>
        <OfferForm
          requestId={bookingRequest.id}
          vehicles={vehicles}
          drivers={drivers}
          carrierRates={{
            ratePerKm: carrier.ratePerKm ? Number(carrier.ratePerKm) : null,
            fixedFee: carrier.fixedFee ? Number(carrier.fixedFee) : null,
          }}
        />
      </Card>
    </div>
  );
}
