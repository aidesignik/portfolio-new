import { useTranslations } from "next-intl";
import { RIDE_STATUS_STYLES, BLOCK_PATTERN_STYLE } from "./statusStyles";
import type { RideStatus } from "./types";

const STATUSES: RideStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export function CalendarLegend() {
  const t = useTranslations("carrier.calendar");
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-[var(--ink-muted)]">
      {STATUSES.map((status) => (
        <div key={status} className="flex items-center gap-[6px]">
          <span className={`h-[10px] w-[10px] rounded-full ${RIDE_STATUS_STYLES[status].label}`} />
          {t(`legend.${status}`)}
        </div>
      ))}
      <div className="flex items-center gap-[6px]">
        <span className="h-[10px] w-[10px] rounded-full border border-[var(--border-strong)]" style={BLOCK_PATTERN_STYLE} />
        {t("legend.BLOCKED")}
      </div>
    </div>
  );
}
