"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
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
      <Button onClick={() => setOpen(true)}>{t("addVehicle")}</Button>
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
