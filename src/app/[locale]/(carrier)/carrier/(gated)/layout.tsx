import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";

export default async function CarrierGatedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations("carrierStatus");

  if (!session?.user.carrierId) {
    redirect(`/${locale}/carrier/onboarding`);
  }

  const status = session.user.carrierStatus;

  if (status && status !== "APPROVED") {
    return (
      <Card>
        <p className="font-medium text-zinc-900">{t(status)}</p>
        <p className="mt-2 text-sm text-zinc-600">{t("pendingNotice")}</p>
        <Link
          href="/carrier/onboarding"
          className="mt-4 inline-block text-sm font-medium underline"
        >
          {t("PENDING")}
        </Link>
      </Card>
    );
  }

  return <>{children}</>;
}
