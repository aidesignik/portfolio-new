import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { RegisterCarrierForm } from "@/components/forms/RegisterCarrierForm";
import { Link } from "@/i18n/navigation";

export default async function RegisterCarrierPage() {
  const t = await getTranslations("auth");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          {t("carrierMarketingTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-lg text-zinc-600">{t("carrierMarketingSubtitle")}</p>
        <ul className="mx-auto mt-6 flex max-w-md flex-col gap-2 text-left text-sm text-zinc-700">
          <li className="flex gap-2">
            <span className="text-zinc-400">✓</span> {t("carrierBenefit1")}
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400">✓</span> {t("carrierBenefit2")}
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400">✓</span> {t("carrierBenefit3")}
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-900">{t("registerCarrierTitle")}</h2>
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
      </div>
    </main>
  );
}
