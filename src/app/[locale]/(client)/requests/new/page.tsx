import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { RequestForm } from "@/components/forms/RequestForm";

export default async function NewRequestPage() {
  const t = await getTranslations("client.requestForm");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("title")}</h1>
      <Card>
        <RequestForm />
      </Card>
    </div>
  );
}
