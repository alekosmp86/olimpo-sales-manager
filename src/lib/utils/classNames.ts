export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Record<string, boolean | undefined | null>
  | ClassValue[];

/**
 * Combines CSS class names into a single space-delimited string,
 * automatically filtering out falsy values (false, null, undefined, "").
 *
 * Examples:
 *   cn(styles.dropdown, showUpward && styles.dropdownUpward)
 *   cn(styles.option, isSelected && styles.active, colorClass)
 *   cn(styles.button, { [styles.disabled]: isDisabled })
 */
export function cn(...inputs: ClassValue[]): string {
  const classList: string[] = [];

  for (const input of inputs) {
    if (!input) {
      continue;
    }

    if (typeof input === "string" || typeof input === "number") {
      classList.push(String(input));
    } else if (Array.isArray(input)) {
      const nestedClasses = cn(...input);
      if (nestedClasses) {
        classList.push(nestedClasses);
      }
    } else if (typeof input === "object") {
      for (const [classNameKey, isEnabled] of Object.entries(input)) {
        if (isEnabled) {
          classList.push(classNameKey);
        }
      }
    }
  }

  return classList.join(" ");
}


