import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/forms/LoginForm";
import { MARKETPLACE_ENABLED } from "@/config/features";
import { AuthSplitScreen } from "@/components/layout/AuthSplitScreen";
import { AuthTabs } from "@/components/layout/AuthTabs";

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
  const registerHref = query.toString() ? `${registerPath}?${query.toString()}` : registerPath;
  const loginHref = query.toString() ? `/login?${query.toString()}` : "/login";

  return (
    <AuthSplitScreen>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-left">
          <h1 className="text-2xl font-semibold text-zinc-900">{t("loginHeadline")}</h1>
        </div>
        <AuthTabs
          active="login"
          loginHref={loginHref}
          registerHref={registerHref}
          loginLabel={t("loginTitle")}
          registerLabel={t("registerTabLabel")}
        />
        <Card bordered={false}>
          <LoginForm />
        </Card>
      </div>
    </AuthSplitScreen>
  );
}
