import type { ReactNode } from "react";

// Shared scroll region + max-width wrapper for every gated carrier page:
// the title row and the work surface (calendar/table) both live inside
// this same 1280px-capped, centered column.
export function PageContent({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto flex h-full min-h-full w-full max-w-[1280px] flex-col gap-5 px-8 pb-8 pt-7">
        {children}
      </div>
    </div>
  );
}
