import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/forms/LoginForm";
import { Link } from "@/i18n/navigation";
import { MARKETPLACE_ENABLED } from "@/config/features";
import { AuthSplitScreen } from "@/components/layout/AuthSplitScreen";

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
  // With the client marketplace hidden, the only signup path is carrier
  // registration — so this becomes the one place to either log in or
  // register, instead of a separate "For carriers" nav item.
  const registerPath = MARKETPLACE_ENABLED ? "/register" : "/register/carrier";
  const registerLabel = MARKETPLACE_ENABLED ? t("registerTitle") : t("registerCarrierTitle");
  const registerHref = query.toString() ? `${registerPath}?${query.toString()}` : registerPath;

  return (
    <AuthSplitScreen>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">{t("loginTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t("newHere")}{" "}
            <Link href={registerHref} className="font-medium text-zinc-900 underline">
              {registerLabel}
            </Link>
          </p>
        </div>
        <Card>
          <LoginForm />
        </Card>
      </div>
    </AuthSplitScreen>
  );
}
