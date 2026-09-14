import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { findAvailableOptions, formatAmenities } from "@/lib/matching";
import { formatLocation } from "@/lib/location";

export default async function ClientRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, t] = await Promise.all([auth(), getTranslations()]);

  const ride = await prisma.ride.findFirst({
    where: { id, clientId: session!.user.id },
    include: {
      stops: { orderBy: { order: "asc" } },
      carrier: true,
      vehicle: true,
      driver: true,
    },
  });
  if (!ride) notFound();

  const showAvailableOptions = ride.status === "PENDING" && !ride.vehicleId;
  const availableOptions = showAvailableOptions
    ? await findAvailableOptions({
        passengerCount: ride.passengerCount,
        departureAt: ride.departureAt,
        returnAt: ride.returnAt,
        estimatedDistanceKm: ride.estimatedDistanceKm,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {formatLocation({ city: ride.pickupCity, location: ride.pickupLocation })}
        </h1>
        {ride.stops.length > 0 ? (
          <div className="mt-1 space-y-0.5">
            {ride.stops.map((stop) => (
              <p key={stop.id} className="text-sm text-zinc-500">
                ↓ {formatLocation(stop)}
              </p>
            ))}
          </div>
        ) : null}
        <p className="mt-1 text-lg font-semibold text-zinc-900">
          → {formatLocation({ city: ride.destinationCity, location: ride.destinationLocation })}
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          {new Date(ride.departureAt).toLocaleString()} · {ride.passengerCount} pax
        </p>
        {ride.isRoundTrip && ride.returnAt ? (
          <p className="text-sm text-zinc-600">
            {t("client.requestForm.returnAt")}: {new Date(ride.returnAt).toLocaleString()}
          </p>
        ) : null}
        <Badge tone={ride.status === "CONFIRMED" ? "positive" : "neutral"}>
          {t(`client.requestStatus.${ride.status}`)}
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
              {availableOptions.map((option) => {
                const amenitiesLabel = formatAmenities(
                  option.amenities.map((a) => t(`amenities.${a}`)),
                  option.otherAmenities,
                );
                return (
                  <Card key={option.vehicleId}>
                    <p className="font-medium text-zinc-900">{option.carrierName}</p>
                    <p className="text-sm text-zinc-600">{option.carrierCity}</p>
                    <p className="mt-2 text-sm text-zinc-700">
                      {t(`vehicleType.${option.type}`)} {option.model} · {option.seats}{" "}
                      {t("client.availableOptions.seats")}
                    </p>
                    {amenitiesLabel ? <p className="mt-1 text-xs text-zinc-500">{amenitiesLabel}</p> : null}
                    {option.estimatedPrice !== null ? (
                      <p className="mt-3 text-lg font-semibold text-zinc-900">
                        ~{option.estimatedPrice.toLocaleString()} RSD
                      </p>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {ride.vehicle && ride.driver && ride.carrier ? (
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-zinc-900">{t("client.assignmentTitle")}</h2>
          <Card className="space-y-1">
            <p className="font-medium text-zinc-900">{ride.carrier.companyName}</p>
            <p className="text-sm text-zinc-600">
              {t(`vehicleType.${ride.vehicle.type}`)} {ride.vehicle.model} · {ride.driver.name}
            </p>
            {ride.price !== null ? (
              <p className="text-xl font-semibold text-zinc-900">
                {Number(ride.price).toLocaleString()} {ride.currency}
              </p>
            ) : null}
            <p className="text-sm text-zinc-600">
              {ride.status === "CONFIRMED" ? t("client.assignmentConfirmed") : t("client.assignmentPending")}
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
