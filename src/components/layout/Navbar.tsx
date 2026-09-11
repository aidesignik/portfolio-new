import { getTranslations } from "next-intl/server";
import { auth } from "@/auth/auth";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SignOutButton } from "./SignOutButton";

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

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          {t("appName")}
        </Link>
        <nav className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link href={dashboardHref} className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                {tNav("dashboard")}
              </Link>
              <SignOutButton label={tNav("logout")} />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                {tNav("login")}
              </Link>
              <Link href="/register" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
                {tNav("register")}
              </Link>
              <Link
                href="/register/carrier"
                className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
              >
                {tNav("forCarriers")}
              </Link>
            </>
          )}
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
