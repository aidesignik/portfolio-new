"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// Turns fetchWithAvailabilityConfirm's "ask the dispatcher" step into the
// app's own ConfirmDialog instead of a native confirm() popup, while
// keeping that function's shape: a plain `(message: string) => Promise<boolean>`
// it can still just await. Render the returned `dialog` as a sibling of the
// form that calls `confirm` (see ConfirmDialog's own note on why it can't
// be nested inside a transformed SidePanel).
export function useAvailabilityConfirmDialog() {
  const t = useTranslations("carrier.calendar");
  const tc = useTranslations("common");
  const [message, setMessage] = useState<string | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((msg: string) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setMessage(msg);
    });
  }, []);

  function settle(result: boolean) {
    setMessage(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  const dialog =
    message !== null ? (
      <ConfirmDialog
        title={t("alreadyBooked")}
        body={message}
        cancelLabel={tc("cancel")}
        confirmLabel={t("assignAnyway")}
        onCancel={() => settle(false)}
        onConfirm={() => settle(true)}
      />
    ) : null;

  return { confirm, dialog };
}
