"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { AuthCredentialsForm } from "@/components/forms/AuthCredentialsForm";

type Mode = "login" | "register";

// Login and registration are really one screen: both forms collect just
// email + password (see AuthCredentialsForm), so switching between them
// flips local state instead of navigating to a different page — no page
// load, no flash, no separate "New here?" link to click through.
export function AuthScreen({
  initialMode,
  loginHeadline,
  loginTabLabel,
  registerTabLabel,
  registerHeadline,
  registerSubtitle,
}: {
  initialMode: Mode;
  loginHeadline: string;
  loginTabLabel: string;
  registerTabLabel: string;
  registerHeadline: string;
  registerSubtitle: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="text-left">
        {mode === "login" ? (
          <h1 className="text-2xl font-semibold text-zinc-900">{loginHeadline}</h1>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-zinc-900">{registerHeadline}</h1>
            <p className="mt-1 text-sm text-zinc-600">{registerSubtitle}</p>
          </>
        )}
      </div>
      <SegmentedControl
        options={[
          { value: "login" as const, label: loginTabLabel },
          { value: "register" as const, label: registerTabLabel },
        ]}
        value={mode}
        onChange={setMode}
      />
      <Card bordered={false}>
        <AuthCredentialsForm mode={mode} />
      </Card>
    </div>
  );
}
