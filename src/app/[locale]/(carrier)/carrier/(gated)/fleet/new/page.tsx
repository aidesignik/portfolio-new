import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { VehicleForm } from "@/components/forms/VehicleForm";

export default async function NewVehiclePage() {
  const t = await getTranslations("carrier");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("addVehicle")}</h1>
      <Card>
        <VehicleForm />
      </Card>
    </div>
  );
}
