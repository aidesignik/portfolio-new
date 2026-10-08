import { AuthCredentialsForm } from "@/components/forms/AuthCredentialsForm";

// The one screen for both login and carrier registration — see
// AuthCredentialsForm for how it tells the two apart (by email, not by
// asking the user to pick a mode up front). No Card wrapper around the
// form: Card's padding was indenting the Google button/fields relative
// to the headline above, which has none.
export function AuthScreen({ headline, subtitle }: { headline: string; subtitle: string }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="text-left">
        <h1 className="text-2xl font-semibold text-zinc-900">{headline}</h1>
        <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
      </div>
      <AuthCredentialsForm />
    </div>
  );
}
