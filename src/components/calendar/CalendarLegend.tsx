import { useTranslations } from "next-intl";
import { RIDE_STATUS_STYLES, BLOCK_PATTERN_STYLE } from "./statusStyles";
import type { RideStatus } from "./types";

const STATUSES: RideStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export function CalendarLegend() {
  const t = useTranslations("carrier.calendar");
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-600">
      {STATUSES.map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-sm ${RIDE_STATUS_STYLES[status].label}`} />
          {t(`legend.${status}`)}
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm border border-zinc-300" style={BLOCK_PATTERN_STYLE} />
        {t("legend.BLOCKED")}
      </div>
    </div>
  );
}
