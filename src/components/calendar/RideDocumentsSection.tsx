"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, FileCheck, Download, Mail } from "lucide-react";
import type { Document, DocumentType } from "@prisma/client";
import { formatShortDate, formatTime24 } from "@/lib/rideDateFormat";
import { EmailDocumentsModal } from "@/components/forms/EmailDocumentsModal";

const TYPES: DocumentType[] = ["CONFIRMATION", "CONTRACT", "INVOICE"];

// Documents are generated server-side (on assignment and on every trip
// edit — see lib/documents/regenerate.ts), so this only ever reads and
// downloads; there's no "Generate" action here. A row without a matching
// GENERATED document yet (a narrow race right after an edit) reads as
// "Updating…" rather than offering a broken download.
export function RideDocumentsSection({ rideId, clientEmail }: { rideId: string; clientEmail: string }) {
  const t = useTranslations();
  const [documents, setDocuments] = useState<Document[] | null>(null);
  // null = closed; an array = open, pre-checked to these types.
  const [emailPreselect, setEmailPreselect] = useState<DocumentType[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Reset to the loading state on every rideId change — standard
    // fetch-on-dependency-change, same accepted pattern used elsewhere
    // (e.g. NewRideModal's availability fetch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDocuments(null);
    fetch(`/api/bookings/${rideId}/documents`)
      .then((res) => (res.ok ? res.json() : { documents: [] }))
      .then(({ documents }) => {
        if (!cancelled) setDocuments(documents);
      })
      .catch(() => {
        if (!cancelled) setDocuments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  if (!documents) return null;

  const readyDocs = documents.filter((d) => d.status === "GENERATED" && d.fileUrl);
  const readyTypes = readyDocs.map((d) => d.type);
  const lastUpdated = readyDocs.map((d) => new Date(d.updatedAt)).sort((a, b) => b.getTime() - a.getTime())[0];

  function markEmailed(sentTypes: DocumentType[], to: string) {
    const now = new Date().toISOString();
    setDocuments((prev) =>
      prev
        ? prev.map((d) => (sentTypes.includes(d.type) ? { ...d, emailedAt: new Date(now), emailedTo: to } : d))
        : prev,
    );
  }

  return (
    <div className="border-t border-[var(--border-hairline)] px-6 py-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-[var(--ink-primary)]">
          {t("carrier.calendar.detail.documents")}
        </h3>
        <div className="flex items-center gap-3">
          {lastUpdated ? (
            <span className="text-[12.5px] text-[var(--ink-muted)]">
              {t("carrier.calendar.detail.autoUpdated", {
                date: `${formatShortDate(lastUpdated)}, ${formatTime24(lastUpdated)}`,
              })}
            </span>
          ) : null}
          {readyTypes.length > 0 ? (
            <button
              type="button"
              onClick={() => setEmailPreselect(readyTypes)}
              className="flex items-center gap-[5px] text-[12.5px] font-semibold text-[var(--action-bg)] hover:underline"
            >
              <Mail size={13} strokeWidth={2} />
              {t("carrier.emailDocuments.trigger")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-col">
        {TYPES.map((type) => {
          const doc = documents.find((d) => d.type === type);
          const ready = doc?.status === "GENERATED" && doc.fileUrl;
          const Icon = ready ? FileCheck : FileText;
          return (
            <div key={type} className="flex h-10 items-center gap-3">
              <Icon size={16} strokeWidth={1.9} color={ready ? "#16A34A" : "#6B6B72"} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--ink-body)]">
                {t(`documents.${type}`)}
              </span>
              {doc?.emailedAt ? (
                <span className="shrink-0 text-[11.5px] text-[var(--ink-muted)]" title={doc.emailedTo ?? undefined}>
                  {t("carrier.emailDocuments.sentBadge")}
                </span>
              ) : null}
              {ready ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEmailPreselect([type])}
                    aria-label={t("carrier.emailDocuments.trigger")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
                  >
                    <Mail size={16} strokeWidth={1.9} />
                  </button>
                  <a
                    href={`/api/documents/${doc.id}/download`}
                    aria-label={t("common.download")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
                  >
                    <Download size={16} strokeWidth={1.9} />
                  </a>
                </>
              ) : (
                <span className="shrink-0 text-[13px] text-[var(--ink-muted)]">
                  {t("carrier.calendar.detail.updating")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {emailPreselect ? (
        <EmailDocumentsModal
          rideId={rideId}
          readyTypes={readyTypes}
          preselectTypes={emailPreselect}
          defaultEmail={clientEmail}
          onClose={() => setEmailPreselect(null)}
          onSent={(sentTypes, to) => markEmailed(sentTypes, to)}
        />
      ) : null}
    </div>
  );
}
