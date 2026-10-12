"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function DeleteButton({ url, redirectTo }: { url: string; redirectTo: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function onDelete() {
    setLoading(true);
    await fetch(url, { method: "DELETE" });
    setLoading(false);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="danger" disabled={loading} onClick={() => setConfirming(true)}>
        {t("delete")}
      </Button>
      {confirming ? (
        <ConfirmDialog
          title={t("deleteConfirmTitle")}
          body={t("deleteConfirmBody")}
          cancelLabel={t("cancel")}
          confirmLabel={t("delete")}
          confirming={loading}
          onCancel={() => setConfirming(false)}
          onConfirm={onDelete}
        />
      ) : null}
    </>
  );
}
