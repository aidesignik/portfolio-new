import type { ReactNode } from "react";

// Shared scroll region for every gated carrier page: the title row and the
// work surface (calendar/table) both live inside this same px-6 gutter, no
// max-width cap — on a wide screen the content fills the panel instead of
// centering with a large empty margin either side (see TopBar, which uses
// the same px-6 so both rows share one consistent edge).
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
        className={`flex h-full min-h-full w-full flex-col gap-5 px-6 ${
          compactTop ? "pt-[18px]" : "pt-7"
        } ${compactBottom ? "pb-3" : "pb-8"}`}
      >
        {children}
      </div>
    </div>
  );
}
