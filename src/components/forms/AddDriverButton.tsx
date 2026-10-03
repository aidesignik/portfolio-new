"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { AddDriverPanel } from "@/components/forms/AddDriverPanel";

// autoOpen lets a link elsewhere (e.g. the calendar's "no drivers yet"
// empty state) land on this page with the add-driver panel already open,
// instead of navigating to a separate full-page form.
export function AddDriverButton({
  vehicles,
  autoOpen = false,
}: {
  vehicles: { id: string; type: string; model: string }[];
  autoOpen?: boolean;
}) {
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
        {t("addDriver")}
      </button>
      {open ? (
        <AddDriverPanel
          vehicles={vehicles}
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
