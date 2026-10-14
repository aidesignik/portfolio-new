// Shared client-side helper for the "advisory, not enforced" availability
// check: submits normally first; if the server reports a conflict (409
// UNAVAILABLE with a conflicts[] list), asks the caller's `confirm` with the
// conflicting date range and, if it resolves true, resubmits with force:true
// so the server bypasses the check. See checkAvailability() in
// lib/availability.ts. `confirm` is expected to back onto the app's own
// ConfirmDialog (see useAvailabilityConfirmDialog) rather than a native
// confirm() popup, but this stays agnostic to how it's rendered.
//
// declinedAvailability distinguishes "the dispatcher said no to the
// warning" from any other failure (a 409 can mean something else entirely,
// e.g. EMAIL_BELONGS_TO_OTHER_ROLE) — callers use it to skip showing a
// generic error banner only for the former.
export interface AvailabilityFetchResult {
  response: Response;
  declinedAvailability: boolean;
}

export async function fetchWithAvailabilityConfirm(
  url: string,
  method: "POST" | "PATCH",
  body: Record<string, unknown>,
  buildMessage: (start: string, end: string) => string,
  confirm: (message: string) => Promise<boolean>,
  // Set when the caller already confirmed this exact assignment up front —
  // e.g. the vehicle/driver picker itself warned "already booked" the
  // moment it was selected (see AssignmentSelect's callers), so asking
  // again here on submit would just repeat the same question. Skips
  // straight to the forced request instead of trying unforced first.
  preConfirmed = false,
): Promise<AvailabilityFetchResult> {
  const send = (force: boolean) =>
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, force }),
    });

  const response = await send(preConfirmed);
  if (preConfirmed || response.status !== 409) return { response, declinedAvailability: false };

  const parsed = await response.clone().json().catch(() => null);
  const conflict = parsed?.error === "UNAVAILABLE" ? parsed.conflicts?.[0] : null;
  if (!conflict) return { response, declinedAvailability: false };

  const start = new Date(conflict.start).toLocaleDateString();
  const end = new Date(conflict.end).toLocaleDateString();
  if (await confirm(buildMessage(start, end))) {
    return { response: await send(true), declinedAvailability: false };
  }
  return { response, declinedAvailability: true };
}
