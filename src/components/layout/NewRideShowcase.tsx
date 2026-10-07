import { getTranslations } from "next-intl/server";
import { Bus, ArrowRight, FileText, Mail, Check } from "lucide-react";

const DOC_ROWS = [
  { labelKey: "showcaseDocContract", reveal: "showcase-doc-1" },
  { labelKey: "showcaseDocInvoice", reveal: "showcase-doc-2" },
  { labelKey: "showcaseDocConfirmation", reveal: "showcase-doc-3" },
] as const;

// Floats over the login/register marketing panel's background video: a
// looping, purely decorative mock of booking a ride — route, suggested
// price, generated documents, then emailed to the client — simplified
// from the real flow to read clearly at a glance rather than matching
// the app screen-for-screen. All motion is driven by the shared
// `showcase-*` keyframes in globals.css — see the comment there for the
// timing model.
export async function NewRideShowcase({ className = "" }: { className?: string }) {
  const t = await getTranslations("auth");

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <div className="flex h-full w-full items-center justify-center p-8">
        <div
          className="w-full max-w-[320px] rounded-[16px] bg-white p-5"
          style={{
            animation: "showcase-card 9s ease-in-out infinite",
            boxShadow: "0 0 0 2px rgba(255,255,255,0.8), inset 0 0 0 1px rgba(255,255,255,0.4)",
          }}
        >
          <div className="flex items-center gap-[8px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px]" style={{ background: "#EFF4FF" }}>
              <Bus size={15} strokeWidth={2} color="#2563EB" />
            </span>
            <span className="text-[14.5px] font-semibold text-[var(--ink-primary)]">{t("showcaseTitle")}</span>
          </div>

          <p
            className="mt-2.5 flex items-center gap-[6px] text-[14px] font-medium text-[var(--ink-primary)]"
            style={{ animation: "showcase-route 9s ease-in-out infinite" }}
          >
            <span>{t("showcasePickupCity")}</span>
            <ArrowRight size={12} strokeWidth={2.2} className="shrink-0 text-[var(--ink-muted)]" />
            <span>{t("showcaseDestinationCity")}</span>
          </p>

          <div className="my-2.5 h-px bg-[var(--border-hairline)]" />

          <div style={{ animation: "showcase-price-row 9s ease-in-out infinite" }}>
            <p className="text-[11.5px] text-[var(--ink-muted)]">{t("showcasePriceLabel")}</p>
            <div className="relative mt-[2px] h-[24px]">
              <span
                className="absolute inset-0 flex items-center text-[13px] text-[var(--ink-muted)]"
                style={{ animation: "showcase-price-placeholder 9s ease-in-out infinite" }}
              >
                {t("showcasePriceCalculating")}
              </span>
              <span
                className="absolute inset-0 -mx-1 flex items-center rounded-[6px] px-1 text-[18px] font-semibold text-[var(--ink-primary)]"
                style={{ animation: "showcase-price-value 9s ease-in-out infinite" }}
              >
                {t("showcasePriceValue")}
              </span>
            </div>
          </div>

          <div className="my-2.5 h-px bg-[var(--border-hairline)]" />

          <div style={{ animation: "showcase-docs-row 9s ease-in-out infinite" }}>
            <p className="text-[11.5px] text-[var(--ink-muted)]">{t("showcaseDocsLabel")}</p>
            <div className="mt-[6px] flex flex-col gap-[5px]">
              {DOC_ROWS.map(({ labelKey, reveal }) => (
                <div
                  key={labelKey}
                  className="flex items-center gap-[8px]"
                  style={{ animation: `${reveal} 9s ease-in-out infinite` }}
                >
                  <FileText size={14} strokeWidth={1.9} color="#16A34A" className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--ink-primary)]">{t(labelKey)}</span>
                  <Check size={13} strokeWidth={2.5} color="#16A34A" className="shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative mt-3 h-[38px]"
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
  );
}
