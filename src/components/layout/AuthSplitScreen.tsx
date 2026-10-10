import type { ReactNode } from "react";
import { AuthBackgroundVideo } from "./AuthBackgroundVideo";
import { NewRideShowcase } from "./NewRideShowcase";

// Shared split-screen shell for the login/register pages: the form sits
// directly on the page background (no shared card/border), a looping
// "create a ride" showcase (same on both pages, since there's only one
// audience while the client marketplace is hidden) floats as its own
// square media panel to the right — a Calendly-style panel standing in
// for a screen recording, a looping abstract video behind the animated
// showcase card. The header above is full-width (logo flush to the true
// page edge), while this hero content is capped at 1120px/40px(20px) —
// deliberately narrower than the header. Vertically centers the row in
// the remaining viewport
// height below the 60px header. Below ~900px the columns wrap: form
// first, square panel full-width underneath.
//
// The panel's size is height-driven, not width-driven: the row stretches
// both columns to the same height (the form's, since it's the taller of
// the two), and the panel is square against THAT height (h-full +
// aspect-square, width auto) rather than its own flex-basis width — so
// it matches the form's height exactly instead of being its own
// independently-sized square. Safe because both /login and
// /register/carrier render the same AuthCredentialsForm, so there's only
// one height to match across every entry point.
export async function AuthSplitScreen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-60px)] max-w-[1120px] items-center px-5 pb-11 pt-[96px] md:px-10">
      <div className="flex w-full flex-wrap justify-between gap-[64px]">
        <div className="min-w-0 flex-[1_1_300px] max-w-[380px]">{children}</div>

        <div className="flex min-w-0 flex-[1_1_340px] max-w-[500px] items-center justify-center">
          <div
            className="aspect-square h-full max-w-full rounded-[26px]"
            style={{ boxShadow: "0 16px 48px rgba(16,30,80,.18)" }}
          >
            {/* The shadow and the corner-clip live on separate elements —
                combining overflow-hidden + border-radius + box-shadow on one
                element leaves a faint seam right at the clip edge in
                Chromium. */}
            <div
              className="relative h-full w-full overflow-hidden rounded-[26px] bg-[#15317F]"
              style={{ transform: "translateZ(0)" }}
            >
              <AuthBackgroundVideo className="absolute inset-0 h-full w-full object-cover" />
              {/* A light scrim keeps the floating white card readable against
                  whatever the video's brightest moment happens to be. */}
              <div className="absolute inset-0 bg-[#0E2466]/20" />
              <NewRideShowcase className="relative h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
