// Display-only license plate formatting, shared by every place a plate is
// shown — uppercases and inserts a hyphen between a letter prefix/suffix and
// the digits when one isn't already present ("bg1233" -> "BG-1233", "1234bh"
// -> "1234-BH"). Never touches the stored value; a plate that already has a
// separator, or doesn't match either simple letters+digits shape, is just
// uppercased.
export function formatPlate(plate: string): string {
  const trimmed = plate.trim();
  if (!trimmed) return trimmed;
  const upper = trimmed.toUpperCase();
  if (upper.includes("-") || upper.includes(" ")) return upper;

  const lettersThenDigits = upper.match(/^([A-Z]+)(\d+)$/);
  if (lettersThenDigits) return `${lettersThenDigits[1]}-${lettersThenDigits[2]}`;

  const digitsThenLetters = upper.match(/^(\d+)([A-Z]+)$/);
  if (digitsThenLetters) return `${digitsThenLetters[1]}-${digitsThenLetters[2]}`;

  return upper;
}
