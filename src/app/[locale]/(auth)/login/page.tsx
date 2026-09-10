import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/forms/LoginForm";
import { Link } from "@/i18n/navigation";

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("loginTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t("loginSubtitle")}</p>
      </div>
      <Card>
        <LoginForm />
      </Card>
      <p className="text-center text-sm text-zinc-600">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-zinc-900 underline">
          {t("registerTitle")}
        </Link>
      </p>
    </main>
  );
}
