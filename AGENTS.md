<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Naming Conventions

- **Never use single-letter variable names.** Every variable must have a descriptive name that communicates its intent (e.g., `response` not `r`, `error` not `e`, `item` not `i`). The only exception is well-established loop counters in short `for` loops where the context is obvious.

# Icons and Emojis

- **Use lucide-react icons.** Do not use raw emoji/unicode text characters (like `⚠️`, `❌`, etc.) in the user interface. Always use the equivalent icons imported from `lucide-react`.

# Comparisons and String Literals

- **Do not compare against string literals.** Statuses, types, and logic reasons must be defined once as constants/enums and imported, rather than compared against raw string literals (like `=== "no_reservation"`).
