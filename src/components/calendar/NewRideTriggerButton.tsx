"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNewRide } from "./NewRideContext";

export function NewRideTriggerButton() {
  const t = useTranslations("carrier.calendar");
  const { openNewRide } = useNewRide();

  return (
    <Button onClick={openNewRide}>
      <Plus size={16} strokeWidth={2} />
      {t("newRide")}
    </Button>
  );
}
