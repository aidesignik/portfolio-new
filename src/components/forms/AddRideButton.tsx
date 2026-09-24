"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { NewRideModal } from "@/components/calendar/NewRideModal";

export function AddRideButton() {
  const t = useTranslations("carrier");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} strokeWidth={2} />
        {t("addRide")}
      </Button>
      {open ? (
        <NewRideModal
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
