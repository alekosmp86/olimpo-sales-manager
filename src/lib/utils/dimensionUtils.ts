/**
 * Normalizes a raw CSV dimension string into a canonical form: "<number> <unit>"
 *
 * Rules applied (in order):
 *  1. Trim outer whitespace
 *  2. Replace decimal commas with dots  ("2,4 mg" → "2.4 mg")
 *  3. Remove stray dots not between two digits  ("1. mg" → "1 mg", "5, mg" → "5 mg")
 *  4. Collapse multiple spaces into one
 *  5. If a numeric part is found followed by a unit → reconstruct as "<num> <unit_lowercase>"
 *  6. If ONLY a bare number is found (no unit) → append " mg" as the default unit
 *  7. Fallback: return the cleaned string as-is (e.g. non-numeric codes like "G+T+M")
 *
 * Examples:
 *   "1mg"     → "1 mg"
 *   "1 mg"    → "1 mg"
 *   "1. mg"   → "1 mg"
 *   "2,4 mg"  → "2.4 mg"
 *   "2.4 mg"  → "2.4 mg"
 *   "7,5 mg"  → "7.5 mg"
 *   "5, mg"   → "5 mg"
 *   "1"       → "1 u"   (bare number — assumes units)
 *   "7"       → "7 u"
 *   "14"      → "14 u"
 *   "G+T+M"   → "G+T+M"  (non-numeric code — returned as-is)
 */
export function standardizeDimension(raw: string | null | undefined): string {
  if (!raw) return "";

  // 1. Replace decimal commas: "2,4" → "2.4", "5," → "5."
  let s = raw.trim().replace(/,/g, ".");

  // 2. Remove stray dots that are NOT between two digits ("1. mg" → "1 mg", "5." → "5")
  s = s.replace(/\.(?!\d)/g, "");

  // 3. Collapse multiple spaces
  s = s.replace(/\s+/g, " ").trim();

  // 4. Number + unit (e.g. "2.4 mg", "1mg", "7,5mg")
  const withUnit = s.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z].*)$/);
  if (withUnit) {
    const num = withUnit[1];
    const unit = withUnit[2].trim().toLowerCase();
    return `${num} ${unit}`;
  }

  // 5. Bare number only — default to "u"
  const bareNumber = s.match(/^(\d+(?:\.\d+)?)$/);
  if (bareNumber) {
    return `${bareNumber[1]} u`;
  }

  // 6. Fallback: non-numeric code (e.g. "G+T+M") — return as-is
  return s;
}
