"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { SidePanel } from "@/components/ui/SidePanel";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { VehicleForm } from "@/components/forms/VehicleForm";

interface VehicleRecord {
  id: string;
  type: string;
  model: string;
  licensePlate: string | null;
  year: number | null;
  seats: number;
  amenities: string[];
  otherAmenities: string | null;
  status: string;
  photos: string[];
  lastRegistrationDate: string | null;
  lastInspectionDate: string | null;
  documentUrls: string[];
}

export function EditVehiclePanel({
  vehicleId,
  onClose,
  onSaved,
}: {
  vehicleId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations();
  const tType = useTranslations("vehicleType");
  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null);
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
    fetch(`/api/carrier/vehicles/${vehicleId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setVehicle(data.vehicle);
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
  }, [vehicleId]);

  async function onDelete() {
    if (!confirm(`${t("common.delete")}?`)) return;
    setDeleting(true);
    await fetch(`/api/carrier/vehicles/${vehicleId}`, { method: "DELETE" });
    setDeleting(false);
    onSaved();
  }

  return (
    <SidePanel onClose={onClose}>
      <PanelHeader
        title={vehicle ? `${tType(vehicle.type)} ${vehicle.model}` : t("common.loading")}
        onClose={onClose}
        closeLabel={t("common.close")}
        actions={
          vehicle ? (
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
        ) : loadFailed || !vehicle ? (
          <p className="text-[13.5px] text-[#7F1D1D]">{t("common.loadFailed")}</p>
        ) : (
          <VehicleForm
            vehicleId={vehicle.id}
            initial={{
              type: vehicle.type,
              model: vehicle.model,
              licensePlate: vehicle.licensePlate,
              year: vehicle.year,
              seats: vehicle.seats,
              amenities: vehicle.amenities,
              otherAmenities: vehicle.otherAmenities,
              status: vehicle.status,
              photos: vehicle.photos,
              lastRegistrationDate: vehicle.lastRegistrationDate,
              lastInspectionDate: vehicle.lastInspectionDate,
              documentUrls: vehicle.documentUrls,
            }}
            onSaved={onSaved}
          />
        )}
      </div>
    </SidePanel>
  );
}
