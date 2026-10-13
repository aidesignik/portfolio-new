"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SidePanel } from "@/components/ui/SidePanel";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { VehicleForm, FieldExpiryChip } from "@/components/forms/VehicleForm";
import type { DocumentChipData } from "@/lib/documentChips";

export function AddVehiclePanel({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations();
  const [expiryChips, setExpiryChips] = useState<DocumentChipData[]>([]);

  return (
    <SidePanel onClose={onClose} label={t("carrier.addVehicle")}>
      <PanelHeader
        title={t("carrier.addVehicle")}
        chips={
          expiryChips.length > 0
            ? expiryChips.map((chip) => <FieldExpiryChip key={chip.docKind} chip={chip} t={t} />)
            : undefined
        }
        onClose={onClose}
        closeLabel={t("common.close")}
      />
      <div className="flex-1 overflow-y-auto px-5 py-[18px]">
        <VehicleForm onSaved={onCreated} onChipsChange={setExpiryChips} />
      </div>
    </SidePanel>
  );
}
