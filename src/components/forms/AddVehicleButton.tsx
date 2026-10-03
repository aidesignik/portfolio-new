"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { AddVehiclePanel } from "@/components/forms/AddVehiclePanel";

// autoOpen lets a link elsewhere (e.g. the calendar's "no vehicles yet"
// empty state) land on this page with the add-vehicle panel already open,
// instead of navigating to a separate full-page form.
export function AddVehicleButton({ autoOpen = false }: { autoOpen?: boolean }) {
  const t = useTranslations("carrier");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(autoOpen);

  useEffect(() => {
    if (autoOpen) router.replace(pathname);
    // Only meant to consume the one-time autoOpen signal from the initial
    // navigation, not react to subsequent prop/route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[38px] shrink-0 items-center gap-[6px] whitespace-nowrap rounded-[9px] bg-[#2563EB] px-[14px] text-[14px] font-medium text-white transition-colors duration-[.12s] ease-out hover:bg-[var(--action-bg-hover)]"
      >
        <Plus size={16} strokeWidth={1.9} />
        {t("addVehicle")}
      </button>
      {open ? (
        <AddVehiclePanel
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
