/**
 * Highlight color constants for cell painting.
 * Map color options to constant string keys used in LocalStorage mapping.
 */
export const HighlightColor = {
  YELLOW: "yellow",
  BLUE: "blue",
  GREEN: "green",
  MAGENTA: "magenta",
  ORANGE: "orange",
} as const;

export type HighlightColor = (typeof HighlightColor)[keyof typeof HighlightColor];
