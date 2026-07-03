export const MONTH_ABBRS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic"
];

/**
 * Formats a string date of format YYYY-MM-DD or ISO string into DD-mmm-YYYY.
 * Example: "2026-06-23T03:00:00.000Z" -> "23-jun-2026"
 */
export function formatReviewDate(dateStr: string): string {
  if (!dateStr) return "";
  const clean = dateStr.slice(0, 10);
  const parts = clean.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    const monthName = MONTH_ABBRS[monthIndex];
    if (monthName) {
      return `${day}-${monthName}-${year}`;
    }
  }
  return clean;
}
