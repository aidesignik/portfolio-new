import { getTranslations } from "next-intl/server";
import { AuthSplitScreen } from "@/components/layout/AuthSplitScreen";
import { AuthScreen } from "@/components/layout/AuthScreen";

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <AuthSplitScreen>
      <AuthScreen headline={t("loginHeadline")} subtitle={t("loginSubtitle")} />
    </AuthSplitScreen>
  );
}
