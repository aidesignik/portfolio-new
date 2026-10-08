import { getTranslations } from "next-intl/server";
import { AuthSplitScreen } from "@/components/layout/AuthSplitScreen";
import { AuthScreen } from "@/components/layout/AuthScreen";

// Same screen as /login — kept as its own route so the navbar's and
// landing page's "Register your company" links still work directly,
// but there's nothing register-specific left to render: the form
// figures out login vs. register from the email itself.
export default async function RegisterCarrierPage() {
  const t = await getTranslations("auth");

  return (
    <AuthSplitScreen>
      <AuthScreen headline={t("loginHeadline")} subtitle={t("loginSubtitle")} />
    </AuthSplitScreen>
  );
}
