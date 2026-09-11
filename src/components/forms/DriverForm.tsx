"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

type DriverFormValues = {
  name: string;
  phone: string;
  isAvailable: boolean;
  vehicleIds: string[];
};

export function DriverForm({
  driverId,
  initial,
  vehicles,
}: {
  driverId?: string;
  initial?: DriverFormValues;
  vehicles: { id: string; make: string; model: string }[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [form, setForm] = useState<DriverFormValues>(
    initial ?? { name: "", phone: "", isAvailable: true, vehicleIds: [] },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleVehicle(vehicleId: string) {
    setForm((prev) => ({
      ...prev,
      vehicleIds: prev.vehicleIds.includes(vehicleId)
        ? prev.vehicleIds.filter((id) => id !== vehicleId)
        : [...prev.vehicleIds, vehicleId],
    }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const url = driverId ? `/api/carrier/drivers/${driverId}` : "/api/carrier/drivers";
    const method = driverId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);

    if (!res.ok) {
      setError(t("common.saveFailed"));
      return;
    }

    router.push("/carrier/drivers");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={t("carrier.driverForm.name")}>
        <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label={t("carrier.driverForm.phone")}>
        <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isAvailable}
          onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
        />
        {t("carrier.driverForm.isAvailable")}
      </label>

      <Field label={t("carrier.driverForm.assignedVehicles")}>
        {vehicles.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("carrier.noVehicles")}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {vehicles.map((vehicle) => (
              <label key={vehicle.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.vehicleIds.includes(vehicle.id)}
                  onChange={() => toggleVehicle(vehicle.id)}
                />
                {vehicle.make} {vehicle.model}
              </label>
            ))}
          </div>
        )}
      </Field>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  );
}
