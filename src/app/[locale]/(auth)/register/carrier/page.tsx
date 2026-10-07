import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { RegisterCarrierForm } from "@/components/forms/RegisterCarrierForm";
import { AuthSplitScreen } from "@/components/layout/AuthSplitScreen";
import { AuthTabs } from "@/components/layout/AuthTabs";

export default async function RegisterCarrierPage() {
  const t = await getTranslations("auth");

  return (
    <AuthSplitScreen>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-left">
          <h1 className="text-2xl font-semibold text-zinc-900">{t("registerCarrierTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t("registerCarrierSubtitle")}</p>
        </div>
        <AuthTabs
          active="register"
          loginHref="/login"
          registerHref="/register/carrier"
          loginLabel={t("loginTitle")}
          registerLabel={t("registerTabLabel")}
        />
        <Card bordered={false}>
          <RegisterCarrierForm />
        </Card>
      </div>
    </AuthSplitScreen>
  );
}
