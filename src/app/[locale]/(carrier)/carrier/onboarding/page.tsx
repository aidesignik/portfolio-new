import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { CarrierProfileForm } from "@/components/forms/CarrierProfileForm";
import { Card } from "@/components/ui/Card";

export default async function CarrierOnboardingPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("carrier")]);
  const carrier = await prisma.carrier.findUniqueOrThrow({ where: { userId: session!.user.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{t("onboardingTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t("onboardingSubtitle")}</p>
      </div>
      <Card>
        <CarrierProfileForm
          carrier={{
            ...carrier,
            ratePerKm: carrier.ratePerKm?.toString() ?? null,
            fixedFee: carrier.fixedFee?.toString() ?? null,
          }}
        />
      </Card>
    </div>
  );
}
