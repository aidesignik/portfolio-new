import { AuthCredentialsForm } from "@/components/forms/AuthCredentialsForm";

// The one screen for both login and carrier registration — see
// AuthCredentialsForm for how it tells the two apart (by email, not by
// asking the user to pick a mode up front). Width is controlled by the
// column wrapper in AuthSplitScreen, not here.
export function AuthScreen({ headline, subtitle }: { headline: string; subtitle: string }) {
  return (
    <div className="flex w-full flex-col gap-7">
      <div>
        <h1 className="m-0 text-[clamp(28px,3.8vw,42px)] font-semibold leading-[1.05] tracking-[-0.03em] text-zinc-900">
          {headline}
        </h1>
        <p className="m-0 mt-3 text-[15px] leading-[1.5] text-zinc-600">{subtitle}</p>
      </div>
      <AuthCredentialsForm />
    </div>
  );
}
