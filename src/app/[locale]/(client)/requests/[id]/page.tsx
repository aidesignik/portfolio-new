import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OfferActions } from "@/components/forms/OfferActions";
import { findAvailableOptions } from "@/lib/matching";

export default async function ClientRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations()]);

  const bookingRequest = await prisma.bookingRequest.findFirst({
    where: { id, clientId: session!.user.id },
    include: { offers: { include: { carrier: true, vehicle: true, driver: true } } },
  });
  if (!bookingRequest) notFound();

  const showAvailableOptions =
    bookingRequest.status === "PENDING" || bookingRequest.status === "OFFERED";
  const availableOptions = showAvailableOptions
    ? await findAvailableOptions({
        passengerCount: bookingRequest.passengerCount,
        departureAt: bookingRequest.departureAt,
        estimatedDistanceKm: bookingRequest.estimatedDistanceKm,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {bookingRequest.pickupAddress} → {bookingRequest.destinationAddress}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {new Date(bookingRequest.departureAt).toLocaleString()} · {bookingRequest.passengerCount} pax
        </p>
        <Badge tone={bookingRequest.status === "CONFIRMED" ? "positive" : "neutral"}>
          {t(`client.requestStatus.${bookingRequest.status}`)}
        </Badge>
      </div>

      {showAvailableOptions ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-zinc-900">{t("client.availableOptions.title")}</h2>
            <p className="text-sm text-zinc-600">{t("client.availableOptions.disclaimer")}</p>
          </div>
          {availableOptions.length === 0 ? (
            <p className="text-sm text-zinc-600">{t("client.availableOptions.none")}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {availableOptions.map((option) => (
                <Card key={option.vehicleId}>
                  <p className="font-medium text-zinc-900">{option.carrierName}</p>
                  <p className="text-sm text-zinc-600">{option.carrierCity}</p>
                  <p className="mt-2 text-sm text-zinc-700">
                    {option.make} {option.model} · {option.seats} {t("client.availableOptions.seats")}
                  </p>
                  {option.amenities.length > 0 ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      {option.amenities.map((a) => t(`amenities.${a}`)).join(" · ")}
                    </p>
                  ) : null}
                  {option.estimatedPrice !== null ? (
                    <p className="mt-3 text-lg font-semibold text-zinc-900">
                      ~{option.estimatedPrice.toLocaleString()} RSD
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-900">{t("client.offersTitle")}</h2>
        {bookingRequest.offers.length === 0 ? (
          <p className="text-sm text-zinc-600">{t("client.noOffers")}</p>
        ) : (
          bookingRequest.offers.map((offer) => (
            <Card key={offer.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{offer.carrier.companyName}</p>
                  <p className="text-sm text-zinc-600">
                    {offer.vehicle.make} {offer.vehicle.model} · {offer.driver.name}
                  </p>
                  <p className="text-sm text-zinc-600">{offer.distanceKm} km</p>
                </div>
                <Badge
                  tone={
                    offer.status === "ACCEPTED"
                      ? "positive"
                      : offer.status === "REJECTED"
                        ? "negative"
                        : "warning"
                  }
                >
                  {t(`offerStatus.${offer.status}`)}
                </Badge>
              </div>
              <p className="text-xl font-semibold text-zinc-900">
                {Number(offer.finalPrice).toLocaleString()} {offer.currency}
              </p>
              {offer.notes ? <p className="text-sm text-zinc-600">{offer.notes}</p> : null}
              {offer.status === "PENDING" ? <OfferActions offerId={offer.id} /> : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
