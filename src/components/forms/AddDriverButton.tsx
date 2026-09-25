"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
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
      <Button onClick={() => setOpen(true)}>{t("addDriver")}</Button>
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
