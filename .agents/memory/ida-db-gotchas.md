---
name: IDA Immobilier DB gotchas
description: Drizzle ORM numeric field behavior and lib rebuild requirement
---

Drizzle `numeric` fields (salePrice, rentalPrice, charges, etc.) return raw strings from the PostgreSQL driver — they are NOT auto-cast to numbers. Every route that returns these fields must call `parseFloat(value)` before sending the JSON response.

**Why:** PostgreSQL's `numeric` type preserves precision as a string in the pg driver to avoid float precision loss. Drizzle doesn't cast automatically.

**How to apply:** Whenever adding a new route that reads a `numeric` column, add explicit parseFloat() in the response mapping. Check existing routes in `artifacts/api-server/src/routes/` for the pattern.

After adding new tables to `lib/db/src/schema/`, run `pnpm run typecheck:libs` before running `pnpm --filter @workspace/api-server run typecheck` — otherwise the api-server sees stale lib declarations and reports "Module '@workspace/db' has no exported member X".

## NUL bytes (0x00) crash text-column inserts

PostgreSQL text/varchar columns reject NUL bytes with `invalid byte sequence for encoding UTF8: 0x00`, returning a 500. This bit the PDF "fiche privée" import: pdf-parse emits some font ligatures (e.g. "ff", "ff") as `\u0000`, so the extracted `fullDescription` contained NUL and the property insert failed.

**Why:** the NUL byte is not valid in PostgreSQL text storage; it must be stripped before any insert/update.

**How to apply:** any free-text that reaches the DB from an external source (PDF extraction, pasted input) must be sanitized. Two layers exist: `parseFiche()` strips NUL + C0 controls from extracted PDF text, and `stripNullBytes()` is applied recursively to `req.body` in `POST`/`PATCH /properties`. Add the same `stripNullBytes` guard to any new write route that accepts free text.
