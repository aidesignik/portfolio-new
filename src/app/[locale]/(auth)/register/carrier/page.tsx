import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { RegisterCarrierForm } from "@/components/forms/RegisterCarrierForm";
import { Link } from "@/i18n/navigation";

export default async function RegisterCarrierPage() {
  const t = await getTranslations("auth");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("registerCarrierTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t("registerCarrierSubtitle")}</p>
      </div>
      <Card>
        <RegisterCarrierForm />
      </Card>
      <p className="text-center text-sm text-zinc-600">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          {t("loginTitle")}
        </Link>
      </p>
    </main>
  );
}
