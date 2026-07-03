# Dimension Normalization Considerations & Design

This document details the rules, design decisions, and future improvement options for dimension string normalization in the Olimpo Sales Management application.

---

## Current Normalization Rules

All dimension strings inputted via CSV import or created/modified through the Catalog interface are normalized to a canonical format:
`"<number> <unit>"`

The rules are applied in `src/lib/utils/dimensionUtils.ts` (specifically inside `standardizeDimension`):

1. **Outer Whitespace Trimming**: Eliminates leading/trailing spaces.
2. **Decimal Separator Standardisation**: Converts decimal commas (`,`) to dots (`.`).
   * *Example:* `2,4 mg` becomes `2.4 mg`.
3. **Stray Punctuation Removal**: Removes dots that are not between two digits (often typed by human error).
   * *Example:* `1. mg` becomes `1 mg`.
   * *Example:* `5, mg` becomes `5 mg`.
4. **Multiple Space Collapsing**: Converts consecutive spaces to a single space.
5. **Canonical Separation**: Ensures exactly one space between the numeric measurement and the unit (with the unit converted to lowercase).
   * *Example:* `1mg` becomes `1 mg`.
   * *Example:* `7.5MG` becomes `7.5 mg`.
6. **Bare Number Handling**: If a dimension contains only a number (e.g. `1`, `7`, `14` from RIB rows), the unit **`u`** is appended by default.
   * *Example:* `7` becomes `7 u`.
7. **Fallback/Non-Numeric Exception**: If the dimension label does not start with a number (e.g. `G+T+M`), the cleaned string is left as-is.

---

## Future Considerations and Improvements

If requirements change or new types of products are added in the future, consider the following enhancements:

### 1. Dynamic Unit Configuration / Multi-Unit Support
Currently, bare numbers default to `"mg"` (milligrams) because the primary inventory items (e.g., Ozempic, Wegovy, Mounjaro) use dosages measured in milligrams.
* **If items using other units (e.g., ml, tabs, UI) are added**:
  * Implement product-type based unit deduction (e.g., if product name is X, default bare numbers to unit Y).
  * Or restrict bare numbers entirely, forcing explicit units in the CSV.

### 2. Dimension Catalog Validation & Auto-complete
Since dimensions are fully editable via the **Catálogo / Dimensiones** button:
* Add a validation warning in the UI if a user enters a dimension that does not conform to the canonical `<number> <unit>` format (while still allowing custom text for special codes like `G+T+M`).

### 3. Automated Duplicate Merging Script
If duplicate dimensions ever slip into the database (for instance, via direct database inserts bypassing the service layer):
* A database script should be created to merge the duplicates:
  1. Identify dimensions that normalize to the same canonical label.
  2. Update all referencing `Product` rows to use the ID of the single canonical `Dimension`.
  3. Delete the redundant `Dimension` records.
