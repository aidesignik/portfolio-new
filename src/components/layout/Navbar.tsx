import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { UserMenu } from "./UserMenu";
import { MARKETPLACE_ENABLED } from "@/config/features";

export async function Navbar() {
  const [session, t, tNav] = await Promise.all([
    auth(),
    getTranslations("common"),
    getTranslations("nav"),
  ]);

  const dashboardHref =
    session?.user.role === "ADMIN"
      ? "/admin/carriers"
      : session?.user.role === "CARRIER"
        ? "/carrier/dashboard"
        : "/dashboard";

  // The avatar dropdown shows who's signed in — the carrier's company name
  // where there is one, falling back to the account name/email otherwise.
  const carrier =
    session?.user.role === "CARRIER"
      ? await prisma.carrier.findUnique({
          where: { userId: session.user.id },
          select: { companyName: true },
        })
      : null;
  const displayName = carrier?.companyName ?? session?.user.name ?? session?.user.email ?? "";
  const profileHref = session?.user.role === "CARRIER" ? "/carrier/onboarding" : null;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          {t("appName")}
        </Link>
        <nav className="flex items-center gap-4">
          {session?.user ? (
            <>
              {/* With the marketplace hidden, "/" already redirects a signed-in
                  user straight to this same page (see src/proxy.ts) — the
                  logo link covers it, so this would just be a duplicate. */}
              {MARKETPLACE_ENABLED ? (
                <Link href={dashboardHref} className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                  {tNav("dashboard")}
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                {tNav("login")}
              </Link>
              {MARKETPLACE_ENABLED ? (
                <Link href="/register" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                  {tNav("register")}
                </Link>
              ) : null}
            </>
          )}
          {/* With the marketplace hidden this would just duplicate the login
              page's own register link, so it only shows once there's a
              distinct client side to contrast it against. */}
          {MARKETPLACE_ENABLED && session?.user.role !== "CARRIER" ? (
            <Link
              href="/register/carrier"
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
            >
              {tNav("forCarriers")}
            </Link>
          ) : null}
          {session?.user ? (
            <UserMenu
              name={displayName}
              email={session.user.email ?? null}
              image={session.user.image}
              profileHref={profileHref}
            />
          ) : (
            <LocaleSwitcher />
          )}
        </nav>
      </div>
    </header>
  );
}
