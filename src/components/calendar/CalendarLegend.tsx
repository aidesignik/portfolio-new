import { useTranslations } from "next-intl";
import { RIDE_STATUS_BG } from "./statusStyles";
import type { RideStatus } from "./types";

const STATUSES: RideStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export function CalendarLegend() {
  const t = useTranslations("carrier.calendar");
  return (
    <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2">
      {STATUSES.map((status) => (
        <div key={status} className="flex items-center gap-[6px]">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: RIDE_STATUS_BG[status] }} />
          <span className="text-[13px]" style={{ color: "#55555C" }}>
            {t(`legend.${status}`)}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-[6px]">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--status-blocked-bg)" }} />
        <span className="text-[13px]" style={{ color: "#55555C" }}>
          {t("legend.BLOCKED")}
        </span>
      </div>
    </div>
  );
}
