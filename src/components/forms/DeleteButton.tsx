"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function DeleteButton({ url, redirectTo }: { url: string; redirectTo: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm(t("delete") + "?")) return;
    setLoading(true);
    await fetch(url, { method: "DELETE" });
    setLoading(false);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button type="button" variant="danger" disabled={loading} onClick={onDelete}>
      {t("delete")}
    </Button>
  );
}
