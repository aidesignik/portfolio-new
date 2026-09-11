import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { RequestForm } from "@/components/forms/RequestForm";
import { readTripSearchState } from "@/lib/tripQueryParams";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [t, params] = await Promise.all([getTranslations("client.requestForm"), searchParams]);
  const trip = readTripSearchState(params);

  const initial = trip ?? {
    pickupCity: "",
    pickupLocation: "",
    destinationCity: "",
    destinationLocation: "",
    stops: [],
    departureAt: "",
    isRoundTrip: false,
    returnAt: "",
    passengerCount: "40",
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("title")}</h1>
      <Card>
        <RequestForm initial={initial} />
      </Card>
    </div>
  );
}
