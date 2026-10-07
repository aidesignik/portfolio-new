import { Link } from "@/i18n/navigation";

// Shared tab switcher for the login/register pages — a real route change
// under the hood (so each keeps its own form fields and submit action,
// bookmarkable and distinct in analytics), but visually it reads as one
// screen with two states rather than a plain "New here?" link.
export function AuthTabs({
  active,
  loginHref,
  registerHref,
  loginLabel,
  registerLabel,
}: {
  active: "login" | "register";
  loginHref: string;
  registerHref: string;
  loginLabel: string;
  registerLabel: string;
}) {
  const tabs = [
    { key: "login" as const, href: loginHref, label: loginLabel },
    { key: "register" as const, href: registerHref, label: registerLabel },
  ];

  return (
    <div className="inline-flex h-9 items-center rounded-[8px] bg-[#F4F4F5] p-[3px]">
      {tabs.map(({ key, href, label }) => (
        <Link
          key={key}
          href={href}
          className={`flex h-full items-center rounded-[6px] px-4 text-[13px] font-medium transition-colors duration-[.12s] ease-out ${
            active === key
              ? "bg-white text-[#18181B] shadow-[0_1px_2px_rgba(24,24,27,.08),0_0_0_1px_rgba(24,24,27,.04)]"
              : "text-[#71717A]"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
