import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/forms/LoginForm";
import { Link } from "@/i18n/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [t, params] = await Promise.all([getTranslations("auth"), searchParams]);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  const registerHref = query.toString() ? `/register?${query.toString()}` : "/register";

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
        <Link href={registerHref} className="font-medium text-zinc-900 underline">
          {t("registerTitle")}
        </Link>
      </p>
    </main>
  );
}
