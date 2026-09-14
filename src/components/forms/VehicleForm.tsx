"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { vehicleAmenities, vehicleStatuses, vehicleTypes } from "@/lib/validation/vehicle.schema";

type VehicleFormValues = {
  type: string;
  model: string;
  licensePlate: string | null;
  year: number | null;
  seats: number;
  amenities: string[];
  otherAmenities: string | null;
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
      licensePlate: "",
      year: new Date().getFullYear(),
      seats: 50,
      amenities: [],
      otherAmenities: "",
      status: "ACTIVE",
      photos: [],
    },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  function toggleAmenity(amenity: string) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  }

  async function onPhotosSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const room = 10 - form.photos.length;
    if (room <= 0) return;

    setPhotoUploading(true);
    setPhotoError(null);

    for (const file of files.slice(0, room)) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/carrier/vehicles/photos", { method: "POST", body });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setPhotoError(
          err?.error === "TOO_LARGE"
            ? t("carrier.vehicleForm.photoTooLarge")
            : err?.error === "UNSUPPORTED_TYPE"
              ? t("carrier.vehicleForm.photoUnsupportedType")
              : t("carrier.vehicleForm.photoUploadFailed"),
        );
        continue;
      }

      const { photoUrl } = await res.json();
      setForm((prev) => ({ ...prev, photos: [...prev.photos, photoUrl] }));
    }

    setPhotoUploading(false);
  }

  function removePhoto(url: string) {
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((p) => p !== url) }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const url = vehicleId ? `/api/carrier/vehicles/${vehicleId}` : "/api/carrier/vehicles";
    const method = vehicleId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        licensePlate: form.licensePlate || undefined,
        year: form.year || undefined,
        otherAmenities: form.otherAmenities || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError(t("carrier.vehicleForm.saveFailed"));
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
        <Field label={t("carrier.vehicleForm.licensePlate")}>
          <Input
            value={form.licensePlate ?? ""}
            onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
          />
        </Field>
        <Field label={t("carrier.vehicleForm.year")}>
          <Input
            type="number"
            value={form.year ?? ""}
            onChange={(e) => setForm({ ...form, year: e.target.value ? Number(e.target.value) : null })}
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
        <Input
          className="mt-2"
          placeholder={t("carrier.vehicleForm.otherAmenitiesPlaceholder")}
          value={form.otherAmenities ?? ""}
          onChange={(e) => setForm({ ...form, otherAmenities: e.target.value })}
        />
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

      <div className="space-y-2">
        {/* Not a <Field>/<label> here on purpose — the per-photo Remove
            buttons need to be normal, independently clickable controls,
            and a <button> nested inside a <label> is invalid HTML that
            browsers handle inconsistently. */}
        <span className="block text-sm font-medium text-zinc-700">{t("carrier.vehicleForm.photos")}</span>
        {form.photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {form.photos.map((url) => (
              <div key={url} className="space-y-1 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-20 w-full rounded-md border border-zinc-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  {t("common.remove")}
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {form.photos.length < 10 ? (
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={photoUploading}
            onChange={onPhotosSelected}
            className="text-sm text-zinc-700 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-50"
          />
        ) : null}
        <p className="text-xs text-zinc-500">
          {photoUploading ? t("common.loading") : t("carrier.vehicleForm.photosUploadHint")}
        </p>
        {photoError ? <p className="text-xs text-red-600">{photoError}</p> : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  );
}
