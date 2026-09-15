"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function DocSideUpload({
  label,
  url,
  uploading,
  onFile,
  onRemove,
}: {
  label: string;
  url: string;
  uploading: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const t = useTranslations();

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFile(file);
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      {url ? (
        <div className="space-y-1 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-24 w-full rounded-md border border-zinc-200 object-cover" />
          <button type="button" onClick={onRemove} className="text-xs font-medium text-red-600 hover:underline">
            {t("common.remove")}
          </button>
        </div>
      ) : (
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={uploading}
          onChange={onChange}
          className="w-full text-xs text-zinc-700 file:mr-2 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-50"
        />
      )}
    </div>
  );
}

function DriverDocumentSection({
  title,
  expiry,
  onExpiryChange,
  frontUrl,
  onFrontChange,
  backUrl,
  onBackChange,
  docType,
}: {
  title: string;
  expiry: string;
  onExpiryChange: (value: string) => void;
  frontUrl: string;
  onFrontChange: (url: string) => void;
  backUrl: string;
  onBackChange: (url: string) => void;
  docType: string;
}) {
  const t = useTranslations();
  const [uploadingSide, setUploadingSide] = useState<"front" | "back" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggested, setSuggested] = useState(false);

  async function upload(side: "front" | "back", file: File) {
    setUploadingSide(side);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    body.append("docType", docType);
    const res = await fetch("/api/carrier/drivers/documents", { method: "POST", body });
    setUploadingSide(null);

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      setError(
        err?.error === "TOO_LARGE"
          ? t("carrier.driverForm.docTooLarge")
          : err?.error === "UNSUPPORTED_TYPE"
            ? t("carrier.driverForm.docUnsupportedType")
            : t("carrier.driverForm.docUploadFailed"),
      );
      return;
    }

    const { url, suggestedExpiry } = await res.json();
    if (side === "front") onFrontChange(url);
    else onBackChange(url);

    // Only offer the suggestion while the field is still blank — never
    // overwrite a date the carrier already typed in or already confirmed.
    if (suggestedExpiry && !expiry) {
      onExpiryChange(suggestedExpiry);
      setSuggested(true);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-zinc-200 p-3">
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      <Field label={t("carrier.driverForm.expiryDate")}>
        <Input
          type="date"
          value={expiry}
          onChange={(e) => {
            onExpiryChange(e.target.value);
            setSuggested(false);
          }}
        />
      </Field>
      {suggested ? <p className="text-xs text-amber-600">{t("carrier.driverForm.expirySuggested")}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <DocSideUpload
          label={t("carrier.driverForm.front")}
          url={frontUrl}
          uploading={uploadingSide === "front"}
          onFile={(file) => upload("front", file)}
          onRemove={() => onFrontChange("")}
        />
        <DocSideUpload
          label={t("carrier.driverForm.back")}
          url={backUrl}
          uploading={uploadingSide === "back"}
          onFile={(file) => upload("back", file)}
          onRemove={() => onBackChange("")}
        />
      </div>
      {uploadingSide ? <p className="text-xs text-zinc-500">{t("common.loading")}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

type DriverFormValues = {
  name: string;
  phone: string;
  isAvailable: boolean;
  vehicleIds: string[];
  idCardExpiry: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  licenseExpiry: string;
  licenseFrontUrl: string;
  licenseBackUrl: string;
  cpcExpiry: string;
  cpcFrontUrl: string;
  cpcBackUrl: string;
  medicalCertExpiry: string;
  medicalCertFrontUrl: string;
  medicalCertBackUrl: string;
};

type InitialDriverValues = Omit<
  DriverFormValues,
  "idCardExpiry" | "licenseExpiry" | "cpcExpiry" | "medicalCertExpiry"
> & {
  idCardExpiry: Date | string | null;
  licenseExpiry: Date | string | null;
  cpcExpiry: Date | string | null;
  medicalCertExpiry: Date | string | null;
};

const EMPTY_FORM: DriverFormValues = {
  name: "",
  phone: "",
  isAvailable: true,
  vehicleIds: [],
  idCardExpiry: "",
  idCardFrontUrl: "",
  idCardBackUrl: "",
  licenseExpiry: "",
  licenseFrontUrl: "",
  licenseBackUrl: "",
  cpcExpiry: "",
  cpcFrontUrl: "",
  cpcBackUrl: "",
  medicalCertExpiry: "",
  medicalCertFrontUrl: "",
  medicalCertBackUrl: "",
};

export function DriverForm({
  driverId,
  initial,
  vehicles,
}: {
  driverId?: string;
  initial?: InitialDriverValues;
  vehicles: { id: string; type: string; model: string }[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [form, setForm] = useState<DriverFormValues>(
    initial
      ? {
          ...initial,
          idCardExpiry: toDateInputValue(initial.idCardExpiry),
          licenseExpiry: toDateInputValue(initial.licenseExpiry),
          cpcExpiry: toDateInputValue(initial.cpcExpiry),
          medicalCertExpiry: toDateInputValue(initial.medicalCertExpiry),
        }
      : EMPTY_FORM,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof DriverFormValues>(key: K, value: DriverFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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
      body: JSON.stringify({
        ...form,
        idCardExpiry: form.idCardExpiry || undefined,
        licenseExpiry: form.licenseExpiry || undefined,
        cpcExpiry: form.cpcExpiry || undefined,
        medicalCertExpiry: form.medicalCertExpiry || undefined,
      }),
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
        <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label={t("carrier.driverForm.phone")}>
        <Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isAvailable}
          onChange={(e) => set("isAvailable", e.target.checked)}
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
                {t(`vehicleType.${vehicle.type}`)} {vehicle.model}
              </label>
            ))}
          </div>
        )}
      </Field>

      <div className="space-y-3 border-t border-zinc-200 pt-4">
        <p className="text-sm font-semibold text-zinc-900">{t("carrier.driverForm.documentsTitle")}</p>
        <DriverDocumentSection
          title={t("carrier.driverForm.idCard")}
          docType="idCard"
          expiry={form.idCardExpiry}
          onExpiryChange={(v) => set("idCardExpiry", v)}
          frontUrl={form.idCardFrontUrl}
          onFrontChange={(v) => set("idCardFrontUrl", v)}
          backUrl={form.idCardBackUrl}
          onBackChange={(v) => set("idCardBackUrl", v)}
        />
        <DriverDocumentSection
          title={t("carrier.driverForm.license")}
          docType="license"
          expiry={form.licenseExpiry}
          onExpiryChange={(v) => set("licenseExpiry", v)}
          frontUrl={form.licenseFrontUrl}
          onFrontChange={(v) => set("licenseFrontUrl", v)}
          backUrl={form.licenseBackUrl}
          onBackChange={(v) => set("licenseBackUrl", v)}
        />
        <DriverDocumentSection
          title={t("carrier.driverForm.cpc")}
          docType="cpc"
          expiry={form.cpcExpiry}
          onExpiryChange={(v) => set("cpcExpiry", v)}
          frontUrl={form.cpcFrontUrl}
          onFrontChange={(v) => set("cpcFrontUrl", v)}
          backUrl={form.cpcBackUrl}
          onBackChange={(v) => set("cpcBackUrl", v)}
        />
        <DriverDocumentSection
          title={t("carrier.driverForm.medicalCert")}
          docType="medicalCert"
          expiry={form.medicalCertExpiry}
          onExpiryChange={(v) => set("medicalCertExpiry", v)}
          frontUrl={form.medicalCertFrontUrl}
          onFrontChange={(v) => set("medicalCertFrontUrl", v)}
          backUrl={form.medicalCertBackUrl}
          onBackChange={(v) => set("medicalCertBackUrl", v)}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  );
}
