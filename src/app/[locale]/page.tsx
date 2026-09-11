import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PublicSearchForm } from "@/components/forms/PublicSearchForm";
import { findAvailableOptions } from "@/lib/matching";
import { bookingRequestSchema } from "@/lib/validation/request.schema";

type SearchParams = Record<string, string | string[] | undefined>;

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [t, tHome, session, params] = await Promise.all([
    getTranslations(),
    getTranslations("home"),
    auth(),
    searchParams,
  ]);

  const defaults = {
    pickupAddress: str(params.pickupAddress),
    destinationAddress: str(params.destinationAddress),
    departureAt: str(params.departureAt),
    isRoundTrip: str(params.isRoundTrip) === "on",
    returnAt: str(params.returnAt),
    passengerCount: str(params.passengerCount),
    estimatedDistanceKm: str(params.estimatedDistanceKm),
  };

  const hasSearch = defaults.pickupAddress.length > 0;
  const parsed = hasSearch
    ? bookingRequestSchema.safeParse({
        pickupAddress: defaults.pickupAddress,
        destinationAddress: defaults.destinationAddress,
        departureAt: defaults.departureAt,
        isRoundTrip: defaults.isRoundTrip,
        returnAt: defaults.returnAt || undefined,
        passengerCount: defaults.passengerCount,
        estimatedDistanceKm: defaults.estimatedDistanceKm || undefined,
      })
    : null;

  const results =
    parsed?.success
      ? await findAvailableOptions({
          passengerCount: parsed.data.passengerCount,
          departureAt: parsed.data.departureAt,
          returnAt: parsed.data.returnAt ?? null,
          estimatedDistanceKm: parsed.data.estimatedDistanceKm ?? null,
        })
      : [];

  const carryQuery = new URLSearchParams();
  if (parsed?.success) {
    carryQuery.set("pickupAddress", defaults.pickupAddress);
    carryQuery.set("destinationAddress", defaults.destinationAddress);
    carryQuery.set("departureAt", defaults.departureAt);
    if (defaults.isRoundTrip) {
      carryQuery.set("isRoundTrip", "on");
      carryQuery.set("returnAt", defaults.returnAt);
    }
    carryQuery.set("passengerCount", defaults.passengerCount);
    if (defaults.estimatedDistanceKm) {
      carryQuery.set("estimatedDistanceKm", defaults.estimatedDistanceKm);
    }
  }
  const carryQueryString = carryQuery.toString();

  const bookHref =
    session?.user.role === "CLIENT"
      ? `/requests/new?${carryQueryString}`
      : `/register?${carryQueryString}`;
  const canShowBookCta = !session?.user || session.user.role === "CLIENT";

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-16">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          {tHome("title")}
        </h1>
        <p className="mx-auto max-w-xl text-lg text-zinc-600">{tHome("subtitle")}</p>
      </div>

      <Card>
        <PublicSearchForm defaults={defaults} />
      </Card>

      {hasSearch ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-zinc-900">{t("client.availableOptions.title")}</h2>
            <p className="text-sm text-zinc-600">{t("client.availableOptions.disclaimer")}</p>
          </div>

          {!parsed?.success ? (
            <p className="text-sm text-red-600">{tHome("invalidSearch")}</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-zinc-600">{t("client.availableOptions.none")}</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((option) => (
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
              {canShowBookCta ? (
                <div className="text-center">
                  <Link href={bookHref}>
                    <Button>
                      {session?.user.role === "CLIENT" ? tHome("bookNow") : tHome("registerToBook")}
                    </Button>
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <div className="space-y-3 border-t border-zinc-200 pt-8 text-center">
        <p className="text-sm text-zinc-600">{tHome("carrierPrompt")}</p>
        <Link href="/register/carrier">
          <Button variant="secondary">{tHome("ctaCarrier")}</Button>
        </Link>
      </div>
    </main>
  );
}
