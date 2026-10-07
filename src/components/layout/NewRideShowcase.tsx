import { getTranslations } from "next-intl/server";
import { Bus, Check, FileText, Mail } from "lucide-react";
import { RingMarker, PinMarker, DotConnector } from "@/components/calendar/newRide/timelineMarkers";

const DOC_ROWS = [
  { labelKey: "showcaseDocContract", reveal: "showcase-doc-1" },
  { labelKey: "showcaseDocInvoice", reveal: "showcase-doc-2" },
  { labelKey: "showcaseDocConfirmation", reveal: "showcase-doc-3" },
] as const;

// Floats over the login/register marketing panel's background video: a
// looping, purely decorative mock of booking a ride, told as two scenes
// that crossfade inside the same fixed-size square card (the card shell
// itself never animates, so it never visibly disappears):
//   Scene A ("compose") — route and price filling the whole card, ending
//     in a "Confirm ride" button that visibly presses to simulate a
//     click once the price has settled.
//   Scene B ("result") — generated documents appearing one by one, then
//     emailed to the client.
// Timing is driven by the shared `showcase-*` keyframes in globals.css.
export async function NewRideShowcase({ className = "" }: { className?: string }) {
  const t = await getTranslations("auth");

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <div className="flex h-full w-full items-center justify-center p-8">
        <div
          className="relative flex aspect-square w-full max-w-[320px] flex-col overflow-hidden rounded-[16px] bg-white p-3.5"
          style={{ boxShadow: "0 0 0 5px rgba(255,255,255,0.4), inset 0 0 0 1px rgba(255,255,255,0.5)" }}
        >
          <div className="flex items-center gap-[8px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px]" style={{ background: "#EFF4FF" }}>
              <Bus size={15} strokeWidth={2} color="#2563EB" />
            </span>
            <span className="text-[14.5px] font-semibold text-[var(--ink-primary)]">{t("showcaseTitle")}</span>
          </div>

          <div className="relative mt-2 min-h-0 flex-1">
            {/* Scene A — compose: route + price, ending in a "Confirm ride" button. */}
            <div
              className="absolute inset-0 flex flex-col"
              style={{ animation: "showcase-scene-a 9s ease-in-out infinite" }}
            >
              <div className="flex flex-col gap-[6px]">
                <div className="flex items-center gap-[10px]">
                  <div className="flex h-5 w-4 shrink-0 items-center justify-center">
                    <RingMarker />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <p className="truncate text-[14.5px] font-medium leading-5 text-[var(--ink-primary)]">
                      {t("showcasePickupCity")}
                    </p>
                    <span className="shrink-0 text-[12px] tabular-nums text-[var(--ink-secondary)]">
                      {t("showcasePickupTime")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-[10px]">
                  <div className="flex w-4 shrink-0 items-center justify-center">
                    <DotConnector />
                  </div>
                </div>
                <div className="flex items-center gap-[10px]">
                  <div className="flex h-5 w-4 shrink-0 items-center justify-center">
                    <PinMarker />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <p className="truncate text-[14.5px] font-medium leading-5 text-[var(--ink-primary)]">
                      {t("showcaseDestinationCity")}
                    </p>
                    <span className="shrink-0 text-[12px] tabular-nums text-[var(--ink-muted)]">
                      {t("showcaseDestinationTime")}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="mt-auto"
                style={{ animation: "showcase-price-row 9s ease-in-out infinite" }}
              >
                <div className="mb-2 h-px bg-[var(--border-hairline)]" />
                <p className="text-[11.5px] text-[var(--ink-muted)]">{t("showcasePriceLabel")}</p>
                <div className="relative mt-[2px] h-[26px]">
                  <span
                    className="absolute inset-0 flex items-center text-[13px] text-[var(--ink-muted)]"
                    style={{ animation: "showcase-price-placeholder 9s ease-in-out infinite" }}
                  >
                    {t("showcasePriceCalculating")}
                  </span>
                  <span
                    className="absolute inset-0 -mx-1 flex items-center rounded-[6px] px-1 text-[19px] font-semibold text-[var(--ink-primary)]"
                    style={{ animation: "showcase-price-value 9s ease-in-out infinite" }}
                  >
                    {t("showcasePriceValue")}
                  </span>
                </div>
              </div>

              <div
                className="mt-2 flex h-[36px] items-center justify-center gap-[6px] rounded-[10px] text-[13.5px] font-semibold text-white"
                style={{ animation: "showcase-button-press 9s ease-in-out infinite", background: "#2563EB" }}
              >
                <Check size={15} strokeWidth={2.5} />
                {t("showcaseConfirmButton")}
              </div>
            </div>

            {/* Scene B — result: generated documents, then emailed to the client. */}
            <div
              className="absolute inset-0 flex flex-col"
              style={{ animation: "showcase-scene-b 9s ease-in-out infinite" }}
            >
              <p className="truncate text-[12.5px] text-[var(--ink-secondary)]">
                {t("showcasePickupCity")} → {t("showcaseDestinationCity")}
                <span className="text-[var(--ink-muted)]"> · {t("showcasePriceValue")}</span>
              </p>

              <div className="my-2 h-px bg-[var(--border-hairline)]" />

              <div style={{ animation: "showcase-docs-row 9s ease-in-out infinite" }}>
                <p className="text-[11.5px] text-[var(--ink-muted)]">{t("showcaseDocsLabel")}</p>
                <div className="mt-[6px] flex flex-col gap-[6px]">
                  {DOC_ROWS.map(({ labelKey, reveal }) => (
                    <div
                      key={labelKey}
                      className="flex items-center gap-[8px]"
                      style={{ animation: `${reveal} 9s ease-in-out infinite` }}
                    >
                      <FileText size={14} strokeWidth={1.9} color="#16A34A" className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--ink-primary)]">
                        {t(labelKey)}
                      </span>
                      <Check size={13} strokeWidth={2.5} color="#16A34A" className="shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="relative mt-auto h-[34px]"
                style={{ animation: "showcase-email-row 9s ease-in-out infinite" }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center gap-[6px] rounded-[10px] text-[13.5px] font-semibold text-white"
                  style={{ animation: "showcase-button-default 9s ease-in-out infinite", background: "#2563EB" }}
                >
                  <Mail size={14} strokeWidth={2} />
                  {t("showcaseEmailButton")}
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center gap-[6px] rounded-[10px] text-[13.5px] font-semibold text-white"
                  style={{ animation: "showcase-button-success 9s ease-in-out infinite", background: "#16A34A" }}
                >
                  <Check size={15} strokeWidth={2.5} />
                  {t("showcaseEmailSent")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
