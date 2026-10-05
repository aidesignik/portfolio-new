import type { ReactNode } from "react";

// Shared scroll region + max-width wrapper for every gated carrier page:
// the title row and the work surface (calendar/table) both live inside
// this same 1280px-capped, centered column.
export function PageContent({
  children,
  compactTop = false,
  compactBottom = false,
}: {
  children: ReactNode;
  // Opt-in, tighter top/bottom padding for the calendar screen, which
  // wants its title closer to the header and its card's bottom gap to
  // match the shell's own gutter — every other page keeps the default
  // spacing (pt-7/pb-8) unchanged.
  compactTop?: boolean;
  compactBottom?: boolean;
}) {
  return (
    // No background of its own — the shell panel behind it (.surface-shell
    // in the gated layout) carries the fill/gradient so it stays fixed
    // instead of scrolling with this region's content.
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div
        className={`mx-auto flex h-full min-h-full w-full max-w-[1280px] flex-col gap-5 px-8 ${
          compactTop ? "pt-[18px]" : "pt-7"
        } ${compactBottom ? "pb-3" : "pb-8"}`}
      >
        {children}
      </div>
    </div>
  );
}
