"use client";

import { useTranslations } from "next-intl";
import { SidePanel } from "@/components/ui/SidePanel";
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
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">{t("carrier.addDriver")}</h2>
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
        <DriverForm vehicles={vehicles} onSaved={onCreated} />
      </div>
    </SidePanel>
  );
}
