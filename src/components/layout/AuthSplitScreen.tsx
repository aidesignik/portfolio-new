import type { ReactNode } from "react";
import { NewRideShowcase } from "./NewRideShowcase";

// Shared split-screen shell for the login/register pages: the form on the
// left, a looping "create a ride" showcase (same on both pages, since
// there's only one audience while the client marketplace is hidden) on the
// right — a Calendly-style animated panel standing in for a screen
// recording. The panel is decorative, so it's dropped below the lg
// breakpoint rather than stacked under the form.
export async function AuthSplitScreen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm lg:grid lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10">{children}</div>

        <div
          className="hidden lg:block"
          style={{
            background:
              "radial-gradient(130% 130% at 12% 8%, #5B90FF 0%, #2E5FE8 42%, #15317F 100%)",
          }}
        >
          <NewRideShowcase className="h-full w-full" />
        </div>
      </div>
    </main>
  );
}
