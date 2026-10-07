import { getTranslations } from "next-intl/server";
import { Bus, ArrowRight, Check } from "lucide-react";
import { VehicleAvatar } from "@/components/ui/VehicleAvatar";
import { DriverAvatar } from "@/components/ui/DriverAvatar";
import { RingMarker, PinMarker, DotConnector } from "@/components/calendar/newRide/timelineMarkers";

// Floats over the login/register marketing panel's background video: a
// looping, purely decorative mock of creating a ride, built from the
// app's own real row components (VehicleAvatar, DriverAvatar, the route
// timeline markers) rather than screen-recorded footage, so the card
// itself never drifts out of sync with how the product actually looks.
// All motion is driven by the shared `showcase-*` keyframes in
// globals.css — see the comment there for the timing model.
export async function NewRideShowcase({ className = "" }: { className?: string }) {
  const t = await getTranslations("auth");

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <div className="flex h-full w-full items-center justify-center p-8">
        <div
          className="w-full max-w-[340px] rounded-[16px] bg-white p-5"
          style={{ animation: "showcase-card 9s ease-in-out infinite", boxShadow: "0 24px 60px rgba(10,22,64,.35)" }}
        >
          <div className="flex items-center gap-[8px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px]" style={{ background: "#EFF4FF" }}>
              <Bus size={15} strokeWidth={2} color="#2563EB" />
            </span>
            <span className="text-[14.5px] font-semibold text-[var(--ink-primary)]">{t("showcaseTitle")}</span>
          </div>

          <p
            className="mt-3 flex items-center gap-[6px] text-[14px] font-medium text-[var(--ink-primary)]"
            style={{ animation: "showcase-route 9s ease-in-out infinite" }}
          >
            <span>{t("showcasePickupCity")}</span>
            <ArrowRight size={12} strokeWidth={2.2} className="shrink-0 text-[var(--ink-muted)]" />
            <span>{t("showcaseDestinationCity")}</span>
          </p>

          <div className="mt-3 flex flex-col">
            <div
              className="flex items-center gap-[10px]"
              style={{ animation: "showcase-stop1 9s ease-in-out infinite" }}
            >
              <RingMarker />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[var(--ink-primary)]">{t("showcasePickupCity")}</p>
                <p className="truncate text-[11.5px] text-[var(--ink-muted)]">{t("showcasePickupLocation")}</p>
              </div>
              <span className="shrink-0 text-[12px] text-[var(--ink-muted)]">09:00</span>
            </div>
            <div style={{ animation: "showcase-connector 9s ease-in-out infinite" }}>
              <DotConnector />
            </div>
            <div
              className="flex items-center gap-[10px]"
              style={{ animation: "showcase-stop2 9s ease-in-out infinite" }}
            >
              <PinMarker />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[var(--ink-primary)]">
                  {t("showcaseDestinationCity")}
                </p>
                <p className="truncate text-[11.5px] text-[var(--ink-muted)]">{t("showcaseDestinationLocation")}</p>
              </div>
              <span className="shrink-0 text-[12px] text-[var(--ink-muted)]">~11:00</span>
            </div>
          </div>

          <div className="my-3 h-px bg-[var(--border-hairline)]" />

          <div className="relative h-[36px]">
            <div
              className="absolute inset-0 flex items-center gap-[10px]"
              style={{ animation: "showcase-vehicle-placeholder 9s ease-in-out infinite" }}
            >
              <VehicleAvatar empty size="xs" />
              <span className="text-[13px] text-[var(--ink-muted)]">{t("showcaseAssignVehicle")}</span>
            </div>
            <div
              className="absolute inset-0 -mx-2 flex items-center gap-[10px] rounded-[8px] px-2"
              style={{ animation: "showcase-vehicle-assigned 9s ease-in-out infinite" }}
            >
              <VehicleAvatar type="COACH" typeLabel={t("showcaseVehicleName")} size="xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[var(--ink-primary)]">
                  {t("showcaseVehicleName")}
                </p>
                <p className="truncate text-[11.5px] text-[var(--ink-muted)]">{t("showcaseVehicleSeats")}</p>
              </div>
            </div>
          </div>

          <div className="relative mt-2 h-[36px]">
            <div
              className="absolute inset-0 flex items-center gap-[10px]"
              style={{ animation: "showcase-driver-placeholder 9s ease-in-out infinite" }}
            >
              <DriverAvatar driver={null} size={26} />
              <span className="text-[13px] text-[var(--ink-muted)]">{t("showcaseAssignDriver")}</span>
            </div>
            <div
              className="absolute inset-0 -mx-2 flex items-center gap-[10px] rounded-[8px] px-2"
              style={{ animation: "showcase-driver-assigned 9s ease-in-out infinite" }}
            >
              <DriverAvatar
                driver={{ id: "showcase", name: t("showcaseDriverName"), avatarColor: "periwinkle" }}
                size={26}
                decorative
              />
              <span className="truncate text-[13px] font-medium text-[var(--ink-primary)]">
                {t("showcaseDriverName")}
              </span>
            </div>
          </div>

          <div className="relative mt-4 h-[38px]">
            <div
              className="absolute inset-0 flex items-center justify-center rounded-[10px] text-[13.5px] font-semibold text-white"
              style={{ animation: "showcase-button-default 9s ease-in-out infinite", background: "#2563EB" }}
            >
              {t("showcaseCreateButton")}
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center gap-[6px] rounded-[10px] text-[13.5px] font-semibold text-white"
              style={{ animation: "showcase-button-success 9s ease-in-out infinite", background: "#16A34A" }}
            >
              <Check size={15} strokeWidth={2.5} />
              {t("showcaseCreatedBadge")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
