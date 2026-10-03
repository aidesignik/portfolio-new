// Lightweight, universal grouping (not a real phone-number library) — keeps
// a leading "+" attached and groups the rest in 3s, e.g.
// "+381641234567" -> "+381 641 234 567".
export function formatPhone(phone: string): string {
  const hasPlus = phone.trim().startsWith("+");
  const digits = phone.replace(/\D/g, "");
  const groups = digits.match(/.{1,3}/g) ?? [digits];
  return (hasPlus ? "+" : "") + groups.join(" ");
}
