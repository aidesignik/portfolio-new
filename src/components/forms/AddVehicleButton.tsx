"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { AddVehiclePanel } from "@/components/forms/AddVehiclePanel";

export function AddVehicleButton() {
  const t = useTranslations("carrier");
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
