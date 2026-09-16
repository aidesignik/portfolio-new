// Single toggle to hide the entire client-facing marketplace (public
// search/landing page, client registration, client dashboard/requests/
// bookings) while carrier and admin pages stay fully functional. Flip back
// to `true` to bring it back — see src/proxy.ts for where this is enforced.
export const MARKETPLACE_ENABLED = false;
