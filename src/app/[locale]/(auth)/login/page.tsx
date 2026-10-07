import { getTranslations } from "next-intl/server";
import { AuthSplitScreen } from "@/components/layout/AuthSplitScreen";
import { AuthScreen } from "@/components/layout/AuthScreen";

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <AuthSplitScreen>
      <AuthScreen
        initialMode="login"
        loginHeadline={t("loginHeadline")}
        loginTabLabel={t("loginTitle")}
        registerTabLabel={t("registerTabLabel")}
        registerHeadline={t("registerCarrierTitle")}
        registerSubtitle={t("registerCarrierSubtitle")}
      />
    </AuthSplitScreen>
  );
}
