import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { RequestForm } from "@/components/forms/RequestForm";

type SearchParams = Record<string, string | string[] | undefined>;

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [t, params] = await Promise.all([getTranslations("client.requestForm"), searchParams]);

  const initial = {
    pickupAddress: str(params.pickupAddress),
    destinationAddress: str(params.destinationAddress),
    departureAt: str(params.departureAt),
    isRoundTrip: str(params.isRoundTrip) === "on",
    returnAt: str(params.returnAt),
    passengerCount: str(params.passengerCount),
    estimatedDistanceKm: str(params.estimatedDistanceKm),
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
