import { Card } from "@/components/ui/Card";
import { AuthCredentialsForm } from "@/components/forms/AuthCredentialsForm";

// The one screen for both login and carrier registration — see
// AuthCredentialsForm for how it tells the two apart (by email, not by
// asking the user to pick a mode up front).
export function AuthScreen({ headline }: { headline: string }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="text-left">
        <h1 className="text-2xl font-semibold text-zinc-900">{headline}</h1>
      </div>
      <Card bordered={false}>
        <AuthCredentialsForm />
      </Card>
    </div>
  );
}
