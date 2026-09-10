import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OfferActions } from "@/components/forms/OfferActions";

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
