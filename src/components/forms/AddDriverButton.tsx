"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { AddDriverPanel } from "@/components/forms/AddDriverPanel";

export function AddDriverButton({ vehicles }: { vehicles: { id: string; type: string; model: string }[] }) {
  const t = useTranslations("carrier");
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
