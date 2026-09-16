// Shared client-side helper for the "advisory, not enforced" availability
// check: submits normally first; if the server reports a conflict (409
// UNAVAILABLE with a conflicts[] list), shows a native confirm() with the
// conflicting date range and, if the dispatcher confirms, resubmits with
// force:true so the server bypasses the check. See checkAvailability() in
// lib/availability.ts.
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
): Promise<AvailabilityFetchResult> {
  const send = (force: boolean) =>
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, force }),
    });

  const response = await send(false);
  if (response.status !== 409) return { response, declinedAvailability: false };

  const parsed = await response.clone().json().catch(() => null);
  const conflict = parsed?.error === "UNAVAILABLE" ? parsed.conflicts?.[0] : null;
  if (!conflict) return { response, declinedAvailability: false };

  const start = new Date(conflict.start).toLocaleDateString();
  const end = new Date(conflict.end).toLocaleDateString();
  if (confirm(buildMessage(start, end))) {
    return { response: await send(true), declinedAvailability: false };
  }
  return { response, declinedAvailability: true };
}
