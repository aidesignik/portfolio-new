import { useTranslations } from "next-intl";
import { RIDE_STATUS_DOT } from "./statusStyles";
import type { RideStatus } from "./types";

const STATUSES: RideStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export function CalendarLegend() {
  const t = useTranslations("carrier.calendar");
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-[6px]">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: RIDE_STATUS_DOT[status] }} />
          <span className="text-[13px] font-medium" style={{ color: "var(--shell-ink-secondary)" }}>
            {t(`legend.${status}`)}
          </span>
        </li>
      ))}
      <li className="flex items-center gap-[6px]">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--status-blocked-dot)" }} />
        <span className="text-[13px] font-medium" style={{ color: "var(--shell-ink-secondary)" }}>
          {t("legend.BLOCKED")}
        </span>
      </li>
    </ul>
  );
}
