"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { Document, DocumentType } from "@prisma/client";

const TYPES: DocumentType[] = ["CONFIRMATION", "CONTRACT", "INVOICE"];

export function DocumentDownloads({
  bookingId,
  initialDocuments,
}: {
  bookingId: string;
  initialDocuments: Document[];
}) {
  const t = useTranslations();
  const [documents, setDocuments] = useState(initialDocuments);
  const [loadingType, setLoadingType] = useState<DocumentType | null>(null);

  async function generate(type: DocumentType) {
    setLoadingType(type);
    const res = await fetch(`/api/bookings/${bookingId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const { document } = await res.json();
      setDocuments((prev) => [...prev.filter((d) => d.type !== type), document]);
    }
    setLoadingType(null);
  }

  return (
    <div className="space-y-2">
      {TYPES.map((type) => {
        const doc = documents.find((d) => d.type === type);
        const isGenerated = doc?.status === "GENERATED";
        return (
          <div key={type} className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2">
            <span className="text-sm font-medium text-zinc-900">{t(`documents.${type}`)}</span>
            {isGenerated ? (
              <a href={`/api/documents/${doc.id}/download`} className="text-sm font-medium text-zinc-900 underline">
                {t("common.download")}
              </a>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={loadingType === type}
                onClick={() => generate(type)}
              >
                {loadingType === type ? t("common.loading") : t("common.generate")}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
