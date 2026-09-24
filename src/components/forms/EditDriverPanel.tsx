"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { SidePanel } from "@/components/ui/SidePanel";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { DriverForm } from "@/components/forms/DriverForm";

interface DriverRecord {
  id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  licenseNumber: string | null;
  vehicles: { vehicleId: string }[];
  idCardExpiry: string | null;
  idCardFrontUrl: string | null;
  idCardBackUrl: string | null;
  licenseExpiry: string | null;
  licenseFrontUrl: string | null;
  licenseBackUrl: string | null;
  cpcExpiry: string | null;
  cpcFrontUrl: string | null;
  cpcBackUrl: string | null;
  medicalCertExpiry: string | null;
  medicalCertFrontUrl: string | null;
  medicalCertBackUrl: string | null;
}

export function EditDriverPanel({
  driverId,
  vehicles,
  onClose,
  onSaved,
}: {
  driverId: string;
  vehicles: { id: string; type: string; model: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations();
  const [driver, setDriver] = useState<DriverRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Standard fetch-on-mount/on-id-change — same accepted pattern as
    // RidesCalendar's load() and NewRideModal's availability fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadFailed(false);
    fetch(`/api/carrier/drivers/${driverId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setDriver(data.driver);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [driverId]);

  async function onDelete() {
    if (!confirm(`${t("common.delete")}?`)) return;
    setDeleting(true);
    await fetch(`/api/carrier/drivers/${driverId}`, { method: "DELETE" });
    setDeleting(false);
    onSaved();
  }

  return (
    <SidePanel onClose={onClose}>
      <PanelHeader
        title={driver ? driver.name : t("common.loading")}
        onClose={onClose}
        closeLabel={t("common.close")}
        actions={
          driver ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label={t("common.delete")}
              title={t("common.delete")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[var(--ink-disabled)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)] hover:text-[#7F1D1D] disabled:opacity-50"
            >
              <Trash2 size={16} strokeWidth={1.9} />
            </button>
          ) : null
        }
      />
      <div className="flex-1 overflow-y-auto px-5 py-[18px]">
        {loading ? (
          <p className="text-[13.5px] text-[var(--ink-disabled)]">{t("common.loading")}</p>
        ) : loadFailed || !driver ? (
          <p className="text-[13.5px] text-[#7F1D1D]">{t("common.loadFailed")}</p>
        ) : (
          <DriverForm
            driverId={driver.id}
            vehicles={vehicles}
            initial={{
              name: driver.name,
              phone: driver.phone,
              isAvailable: driver.isAvailable,
              licenseNumber: driver.licenseNumber ?? "",
              vehicleIds: driver.vehicles.map((v) => v.vehicleId),
              idCardExpiry: driver.idCardExpiry,
              idCardFrontUrl: driver.idCardFrontUrl ?? "",
              idCardBackUrl: driver.idCardBackUrl ?? "",
              licenseExpiry: driver.licenseExpiry,
              licenseFrontUrl: driver.licenseFrontUrl ?? "",
              licenseBackUrl: driver.licenseBackUrl ?? "",
              cpcExpiry: driver.cpcExpiry,
              cpcFrontUrl: driver.cpcFrontUrl ?? "",
              cpcBackUrl: driver.cpcBackUrl ?? "",
              medicalCertExpiry: driver.medicalCertExpiry,
              medicalCertFrontUrl: driver.medicalCertFrontUrl ?? "",
              medicalCertBackUrl: driver.medicalCertBackUrl ?? "",
            }}
            onSaved={onSaved}
          />
        )}
      </div>
    </SidePanel>
  );
}
