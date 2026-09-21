"use client";

import { useTranslations } from "next-intl";
import { SidePanel } from "@/components/ui/SidePanel";
import { VehicleForm } from "@/components/forms/VehicleForm";

export function AddVehiclePanel({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations();

  return (
    <SidePanel onClose={onClose}>
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">{t("carrier.addVehicle")}</h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-zinc-400 hover:text-zinc-700"
          aria-label={t("common.close")}
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <VehicleForm onSaved={onCreated} />
      </div>
    </SidePanel>
  );
}
