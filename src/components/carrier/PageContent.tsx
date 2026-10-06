import type { ReactNode } from "react";

// Shared scroll region for every gated carrier page: the title row and the
// work surface (calendar/table) both live inside this same px-6 gutter, no
// max-width cap — on a wide screen the content fills the panel instead of
// centering with a large empty margin either side (see TopBar, which uses
// the same px-6 so both rows share one consistent edge).
//
// pt-4 (16px) here, added to TopBar's own 24px bottom padding, makes the
// gap between the top bar row and the title row exactly 40px. gap-6 (24px)
// is the gap between the title row and whatever comes next (the calendar
// card, a table, ...) — both values are the same on every page using this
// pattern, by design.
export function PageContent({
  children,
  compactBottom = false,
}: {
  children: ReactNode;
  // Opt-in, tighter bottom padding for the calendar screen, which wants
  // its card's bottom gap to match the shell's own gutter — every other
  // page keeps the default (pb-8) unchanged.
  compactBottom?: boolean;
}) {
  return (
    // No background of its own — the shell panel behind it (.surface-shell
    // in the gated layout) carries the fill/gradient so it stays fixed
    // instead of scrolling with this region's content.
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className={`flex h-full min-h-full w-full flex-col gap-6 px-6 pt-4 ${compactBottom ? "pb-3" : "pb-8"}`}>
        {children}
      </div>
    </div>
  );
}
