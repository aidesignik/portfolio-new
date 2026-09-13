"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { vehicleAmenities, vehicleStatuses, vehicleTypes } from "@/lib/validation/vehicle.schema";

type VehicleFormValues = {
  type: string;
  model: string;
  year: number;
  seats: number;
  amenities: string[];
  status: string;
  photos: string[];
};

export function VehicleForm({
  vehicleId,
  initial,
}: {
  vehicleId?: string;
  initial?: VehicleFormValues;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [form, setForm] = useState<VehicleFormValues>(
    initial ?? {
      type: vehicleTypes[0],
      model: "",
      year: new Date().getFullYear(),
      seats: 50,
      amenities: [],
      status: "ACTIVE",
      photos: [],
    },
  );
  const [photosText, setPhotosText] = useState(initial?.photos.join("\n") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleAmenity(amenity: string) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const photos = photosText
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);
    const url = vehicleId ? `/api/carrier/vehicles/${vehicleId}` : "/api/carrier/vehicles";
    const method = vehicleId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, photos }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const invalidPhoto = body?.error?.fieldErrors?.photos;
      setError(
        invalidPhoto
          ? t("carrier.vehicleForm.invalidPhotoUrl")
          : t("carrier.vehicleForm.saveFailed"),
      );
      return;
    }

    router.push("/carrier/fleet");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("carrier.vehicleForm.type")}>
          <select
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {t(`vehicleType.${type}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("carrier.vehicleForm.model")}>
          <Input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        </Field>
        <Field label={t("carrier.vehicleForm.year")}>
          <Input
            type="number"
            required
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
          />
        </Field>
        <Field label={t("carrier.vehicleForm.seats")}>
          <Input
            type="number"
            required
            value={form.seats}
            onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
          />
        </Field>
      </div>

      <Field label={t("carrier.vehicleForm.amenities")}>
        <div className="flex flex-wrap gap-3">
          {vehicleAmenities.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
              />
              {t(`amenities.${amenity}`)}
            </label>
          ))}
        </div>
      </Field>

      <Field label={t("carrier.vehicleForm.status")}>
        <select
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          {vehicleStatuses.map((status) => (
            <option key={status} value={status}>
              {t(`vehicleStatus.${status}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("carrier.vehicleForm.photos")}>
        <textarea
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          rows={3}
          placeholder={t("carrier.vehicleForm.photosPlaceholder")}
          value={photosText}
          onChange={(e) => setPhotosText(e.target.value)}
        />
      </Field>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  );
}
