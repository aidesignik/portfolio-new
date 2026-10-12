"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function CarrierApprovalActions({ carrierId }: { carrierId: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function act(approve: boolean, key: "approve" | "reject") {
    setLoading(key);
    await fetch(`/api/admin/carriers/${carrierId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        disabled={loading !== null}
        aria-busy={loading === "approve" || undefined}
        onClick={() => act(true, "approve")}
      >
        {t("approve")}
      </Button>
      <Button
        type="button"
        variant="danger"
        disabled={loading !== null}
        aria-busy={loading === "reject" || undefined}
        onClick={() => act(false, "reject")}
      >
        {t("reject")}
      </Button>
    </div>
  );
}
