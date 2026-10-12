import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthSplitScreen } from "@/components/layout/AuthSplitScreen";
import { AuthScreen } from "@/components/layout/AuthScreen";

// A new or returning user lands here the same way, so the tab title
// shouldn't commit to either — "Register"/"Sign up" would read oddly for
// someone just logging back in.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("continuePageTitle") };
}

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
