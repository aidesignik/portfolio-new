"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { vehicleAmenities, vehicleStatuses, vehicleTypes } from "@/lib/validation/vehicle.schema";

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function docNameFromUrl(url: string): string {
  return url.split("/").pop() ?? url;
}

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
  lastRegistrationDate: string;
  lastInspectionDate: string;
  documentUrls: string[];
};

type InitialVehicleValues = Omit<VehicleFormValues, "lastRegistrationDate" | "lastInspectionDate"> & {
  lastRegistrationDate: Date | string | null;
  lastInspectionDate: Date | string | null;
};

export function VehicleForm({
  vehicleId,
  initial,
  onSaved,
}: {
  vehicleId?: string;
  initial?: InitialVehicleValues;
  // When rendered inside the "add vehicle" side panel, closes the panel
  // and refreshes the list instead of navigating to the standalone fleet
  // page — the panel is already on that page.
  onSaved?: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [form, setForm] = useState<VehicleFormValues>(
    initial
      ? {
          ...initial,
          lastRegistrationDate: toDateInputValue(initial.lastRegistrationDate),
          lastInspectionDate: toDateInputValue(initial.lastInspectionDate),
        }
      : {
          type: vehicleTypes[0],
          model: "",
          licensePlate: "",
          year: new Date().getFullYear(),
          seats: 50,
          amenities: [],
          otherAmenities: "",
          status: "ACTIVE",
          photos: [],
          lastRegistrationDate: "",
          lastInspectionDate: "",
          documentUrls: [],
        },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

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

  async function onDocumentsSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const room = 10 - form.documentUrls.length;
    if (room <= 0) return;

    setDocUploading(true);
    setDocError(null);

    for (const file of files.slice(0, room)) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/carrier/vehicles/documents", { method: "POST", body });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setDocError(
          err?.error === "TOO_LARGE"
            ? t("carrier.vehicleForm.docTooLarge")
            : err?.error === "UNSUPPORTED_TYPE"
              ? t("carrier.vehicleForm.docUnsupportedType")
              : t("carrier.vehicleForm.docUploadFailed"),
        );
        continue;
      }

      const { url } = await res.json();
      setForm((prev) => ({ ...prev, documentUrls: [...prev.documentUrls, url] }));
    }

    setDocUploading(false);
  }

  function removeDocument(url: string) {
    setForm((prev) => ({ ...prev, documentUrls: prev.documentUrls.filter((d) => d !== url) }));
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
        lastRegistrationDate: form.lastRegistrationDate || undefined,
        lastInspectionDate: form.lastInspectionDate || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError(t("carrier.vehicleForm.saveFailed"));
      return;
    }

    if (onSaved) {
      onSaved();
      return;
    }
    router.push("/carrier/fleet");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-[18px]">
      <div className="grid gap-[10px] sm:grid-cols-2">
        <Field label={t("carrier.vehicleForm.type")}>
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {t(`vehicleType.${type}`)}
              </option>
            ))}
          </Select>
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
        <Field label={t("carrier.vehicleForm.lastRegistrationDate")}>
          <Input
            type="date"
            value={form.lastRegistrationDate}
            onChange={(e) => setForm({ ...form, lastRegistrationDate: e.target.value })}
          />
        </Field>
        <Field label={t("carrier.vehicleForm.lastInspectionDate")}>
          <Input
            type="date"
            value={form.lastInspectionDate}
            onChange={(e) => setForm({ ...form, lastInspectionDate: e.target.value })}
          />
        </Field>
      </div>

      <Field label={t("carrier.vehicleForm.amenities")}>
        <div className="flex flex-wrap gap-3">
          {vehicleAmenities.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 text-[14px] text-[var(--ink-2)]">
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
        <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {vehicleStatuses.map((status) => (
            <option key={status} value={status}>
              {t(`vehicleStatus.${status}`)}
            </option>
          ))}
        </Select>
      </Field>

      <div className="space-y-2">
        {/* Not a <Field>/<label> here on purpose — the per-photo Remove
            buttons need to be normal, independently clickable controls,
            and a <button> nested inside a <label> is invalid HTML that
            browsers handle inconsistently. */}
        <span className="block text-[13px] font-semibold text-[var(--ink-2)]">{t("carrier.vehicleForm.photos")}</span>
        {form.photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {form.photos.map((url) => (
              <div key={url} className="space-y-1 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-20 w-full rounded-[10px] border border-[var(--border-hairline)] object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="text-[12.5px] font-semibold text-[#7F1D1D] hover:underline"
                >
                  {t("common.remove")}
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {form.photos.length < 10 ? (
          <label className="flex cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[var(--border-strong)] p-[11px] text-center text-[12.5px] font-semibold text-[var(--action-bg)]">
            {t("common.chooseFiles")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={photoUploading}
              onChange={onPhotosSelected}
              className="hidden"
            />
          </label>
        ) : null}
        <p className="text-[12.5px] text-[var(--ink-muted)]">
          {photoUploading ? t("common.loading") : t("carrier.vehicleForm.photosUploadHint")}
        </p>
        {photoError ? <p className="text-[12.5px] text-[#7F1D1D]">{photoError}</p> : null}
      </div>

      <div className="space-y-2">
        <span className="block text-[13px] font-semibold text-[var(--ink-2)]">{t("carrier.vehicleForm.documents")}</span>
        {form.documentUrls.length > 0 ? (
          <ul className="space-y-1">
            {form.documentUrls.map((url) => (
              <li
                key={url}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--border-hairline)] px-3 py-2 text-[13.5px]"
              >
                <a href={url} target="_blank" rel="noreferrer" className="truncate text-[var(--ink-2)] underline">
                  {docNameFromUrl(url)}
                </a>
                <button
                  type="button"
                  onClick={() => removeDocument(url)}
                  className="shrink-0 text-[12.5px] font-semibold text-[#7F1D1D] hover:underline"
                >
                  {t("common.remove")}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {form.documentUrls.length < 10 ? (
          <label className="flex cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[var(--border-strong)] p-[11px] text-center text-[12.5px] font-semibold text-[var(--action-bg)]">
            {t("common.chooseFiles")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              multiple
              disabled={docUploading}
              onChange={onDocumentsSelected}
              className="hidden"
            />
          </label>
        ) : null}
        <p className="text-[12.5px] text-[var(--ink-muted)]">
          {docUploading ? t("common.loading") : t("carrier.vehicleForm.documentsUploadHint")}
        </p>
        {docError ? <p className="text-[12.5px] text-[#7F1D1D]">{docError}</p> : null}
      </div>

      {error ? <p className="text-[13.5px] text-[#7F1D1D]">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  );
}
