import { AuthCredentialsForm } from "@/components/forms/AuthCredentialsForm";

// The one screen for both login and carrier registration — see
// AuthCredentialsForm for how it tells the two apart (by email, not by
// asking the user to pick a mode up front). Width is controlled by the
// column wrapper in AuthSplitScreen, not here.
export function AuthScreen({ headline, subtitle }: { headline: string; subtitle: string }) {
  return (
    <div className="flex w-full flex-col gap-9">
      <div>
        <h1 className="m-0 text-balance text-[38px] font-semibold leading-[1.1] tracking-[-0.04em] text-[var(--hero-ink)] md:text-[56px] md:leading-[1.08]">
          {headline}
        </h1>
        <p className="m-0 mt-5 text-balance text-[16px] leading-[1.55] text-[var(--hero-ink-muted)] md:text-[18px]">
          {subtitle}
        </p>
      </div>
      <AuthCredentialsForm />
    </div>
  );
}
