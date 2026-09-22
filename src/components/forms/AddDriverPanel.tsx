"use client";

import { useTranslations } from "next-intl";
import { SidePanel } from "@/components/ui/SidePanel";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { DriverForm } from "@/components/forms/DriverForm";

export function AddDriverPanel({
  onClose,
  onCreated,
  vehicles,
}: {
  onClose: () => void;
  onCreated: () => void;
  vehicles: { id: string; type: string; model: string }[];
}) {
  const t = useTranslations();

  return (
    <SidePanel onClose={onClose}>
      <PanelHeader title={t("carrier.addDriver")} onClose={onClose} closeLabel={t("common.close")} />
      <div className="flex-1 overflow-y-auto px-5 py-[18px]">
        <DriverForm vehicles={vehicles} onSaved={onCreated} />
      </div>
    </SidePanel>
  );
}
