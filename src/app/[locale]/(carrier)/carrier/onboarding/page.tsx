import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { CarrierProfileForm } from "@/components/forms/CarrierProfileForm";
import { Card } from "@/components/ui/Card";

export default async function CarrierOnboardingPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("carrier")]);
  const carrier = await prisma.carrier.findUnique({
    where: { userId: session!.user.id },
    // Select only what CarrierProfileForm needs — the full row also carries
    // Decimal fields (ratePerKm/fixedFee), which can't be passed from a
    // Server Component to a Client Component as-is.
    select: {
      companyName: true,
      taxId: true,
      registrationNumber: true,
      legalRepresentative: true,
      contactEmail: true,
      contactPhone: true,
      city: true,
      address: true,
      postalCode: true,
      logoUrl: true,
    },
  });
  const isNew = carrier === null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {isNew ? t("completeProfileTitle") : t("onboardingTitle")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {isNew ? t("completeProfileSubtitle") : t("onboardingSubtitle")}
        </p>
      </div>
      <Card>
        <CarrierProfileForm email={session!.user.email!} carrier={carrier} />
      </Card>
    </div>
  );
}
