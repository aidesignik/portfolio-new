"use client";

import { useTranslations } from "next-intl";
import { SidePanel } from "@/components/ui/SidePanel";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { VehicleForm } from "@/components/forms/VehicleForm";

export function AddVehiclePanel({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations();

  return (
    <SidePanel onClose={onClose}>
      <PanelHeader title={t("carrier.addVehicle")} onClose={onClose} closeLabel={t("common.close")} />
      <div className="flex-1 overflow-y-auto px-5 py-[18px]">
        <VehicleForm onSaved={onCreated} />
      </div>
    </SidePanel>
  );
}
