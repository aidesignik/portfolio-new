// A booking's client is often an organization (a sports federation, a
// company) booking through one contact person — prefer the organization
// name wherever we only have room for one label, since that's what
// actually identifies the booking to a carrier scanning a list or
// calendar; fall back to the contact person when no company was given.
export function clientDisplayName(client: { name: string | null; companyName: string | null }): string {
  return client.companyName || client.name || "—";
}
