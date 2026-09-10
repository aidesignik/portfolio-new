import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { RegisterClientForm } from "@/components/forms/RegisterClientForm";
import { Link } from "@/i18n/navigation";

export default async function RegisterPage() {
  const t = await getTranslations("auth");

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("registerTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t("registerSubtitle")}</p>
      </div>
      <Card>
        <RegisterClientForm />
      </Card>
      <p className="text-center text-sm text-zinc-600">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          {t("loginTitle")}
        </Link>
      </p>
      <p className="text-center text-sm text-zinc-600">
        <Link href="/register/carrier" className="underline">
          {t("asCarrier")}
        </Link>
      </p>
    </main>
  );
}
