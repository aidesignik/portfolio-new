import { useTranslations } from "next-intl";
import type { RideStatus } from "./types";

const STATUSES: RideStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

const DOT_STYLE: Record<RideStatus, React.CSSProperties> = {
  PENDING: { background: "transparent", border: "2px solid #F97316" },
  CONFIRMED: { background: "#2563EB" },
  COMPLETED: { background: "#16A34A" },
  CANCELLED: { background: "#A9A9B2" },
};

export function CalendarLegend() {
  const t = useTranslations("carrier.calendar");
  return (
    <div className="flex flex-wrap items-center gap-x-[14px] gap-y-2">
      {STATUSES.map((status) => (
        <div key={status} className="flex items-center gap-[6px]">
          <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={DOT_STYLE[status]} />
          <span className="text-[12.5px] text-[var(--ink-secondary)]">{t(`legend.${status}`)}</span>
        </div>
      ))}
      <div className="flex items-center gap-[6px]">
        <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: "#7C3AED" }} />
        <span className="text-[12.5px] text-[var(--ink-secondary)]">{t("legend.BLOCKED")}</span>
      </div>
    </div>
  );
}
