import { Search, Bell } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "@/components/layout/UserMenu";

// Persistent, page-agnostic — search, notifications, avatar only. Never a
// page title or a primary action; those live in each page's own title row.
export async function TopBar() {
  const [session, t] = await Promise.all([auth(), getTranslations("common")]);
  const carrier = session
    ? await prisma.carrier.findUnique({ where: { userId: session.user.id }, select: { companyName: true } })
    : null;
  const displayName = carrier?.companyName ?? session?.user.name ?? session?.user.email ?? "";

  return (
    <div className="flex shrink-0">
      {/* Same px-6 gutter as PageContent below (no max-width cap on
          either), so the search bar and avatar line up with the
          calendar/table edges at any screen width. py-6 matches that
          same 24px so the gap above the search bar is an actual,
          deliberate padding value instead of an incidental few px left
          over from centering it in a fixed-height row. */}
      <div className="flex w-full items-center justify-between gap-4 px-6 py-6">
        <div className="relative w-full max-w-[420px]">
          <Search
            size={18}
            strokeWidth={1.9}
            color="#8A8A83"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="search"
            placeholder={t("search")}
            className="h-11 w-full rounded-[12px] border-0 bg-[var(--surface-card-bg)] pl-10 pr-16 text-[14px] text-[var(--ink-primary)] placeholder:text-[var(--shell-ink-faint)] outline-none transition-shadow duration-[.12s] ease-out focus:shadow-[var(--focus-ring)]"
            style={{ boxShadow: "var(--ring-2)" }}
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-[6px] bg-[#F4F4F1] px-[6px] py-[2px] font-mono text-[11.5px] font-medium text-[var(--shell-ink-faint)] shadow-[var(--shadow-kbd)]">
            ⌘K
          </kbd>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-[12px] text-[var(--shell-ink-secondary)] transition-colors duration-[.12s] ease-out hover:bg-[var(--border-soft)]"
            aria-label={t("notifications")}
          >
            <Bell size={18} strokeWidth={1.9} />
            <span
              aria-hidden
              className="absolute right-[9px] top-[9px] h-2 w-2 rounded-full"
              style={{ background: "#D64553", boxShadow: "0 0 0 2px var(--surface-shell-bg)" }}
            />
          </button>
          <UserMenu
            name={displayName}
            email={session?.user.email ?? null}
            image={session?.user.image}
            profileHref="/carrier/onboarding"
            size={40}
            ringed
          />
        </div>
      </div>
    </div>
  );
}
