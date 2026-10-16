import crypto from "crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// The raw token is what goes in the emailed link; only its hash is ever
// stored, so a database leak alone can't be used to reset someone's
// password.
export function generateResetToken(): { raw: string; tokenHash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, tokenHash: hashResetToken(raw) };
}

export function hashResetToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
