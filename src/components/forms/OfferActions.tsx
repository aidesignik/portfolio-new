"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function OfferActions({ offerId }: { offerId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  async function act(action: "confirm" | "reject", key: "accept" | "reject") {
    if (action === "confirm" && !confirm(t("client.acceptConfirm"))) return;
    setLoading(key);
    await fetch(`/api/offers/${offerId}/${action}`, { method: "POST" });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button type="button" disabled={loading !== null} onClick={() => act("confirm", "accept")}>
        {loading === "accept" ? "…" : t("common.accept")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={loading !== null}
        onClick={() => act("reject", "reject")}
      >
        {loading === "reject" ? "…" : t("common.reject")}
      </Button>
    </div>
  );
}
