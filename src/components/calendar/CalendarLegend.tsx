import { useTranslations } from "next-intl";
import type { RideStatus } from "./types";

const STATUSES: RideStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

const DOT_STYLE: Record<RideStatus, React.CSSProperties> = {
  PENDING: { background: "transparent", border: "1.5px solid #F97316" },
  CONFIRMED: { background: "#2563EB" },
  COMPLETED: { background: "#16A34A" },
  CANCELLED: { background: "#A1A1AA" },
};

export function CalendarLegend() {
  const t = useTranslations("carrier.calendar");
  return (
    <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2">
      {STATUSES.map((status) => (
        <div key={status} className="flex items-center gap-[6px]">
          <span className="h-2 w-2 shrink-0 rounded-full" style={DOT_STYLE[status]} />
          <span className="text-[13px]" style={{ color: "#55555C" }}>
            {t(`legend.${status}`)}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-[6px]">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#A78BFA" }} />
        <span className="text-[13px]" style={{ color: "#55555C" }}>
          {t("legend.BLOCKED")}
        </span>
      </div>
    </div>
  );
}
