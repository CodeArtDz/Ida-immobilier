---
name: IDA Immobilier DB gotchas
description: Drizzle ORM numeric field behavior and lib rebuild requirement
---

Drizzle `numeric` fields (salePrice, rentalPrice, charges, etc.) return raw strings from the PostgreSQL driver — they are NOT auto-cast to numbers. Every route that returns these fields must call `parseFloat(value)` before sending the JSON response.

**Why:** PostgreSQL's `numeric` type preserves precision as a string in the pg driver to avoid float precision loss. Drizzle doesn't cast automatically.

**How to apply:** Whenever adding a new route that reads a `numeric` column, add explicit parseFloat() in the response mapping. Check existing routes in `artifacts/api-server/src/routes/` for the pattern.

After adding new tables to `lib/db/src/schema/`, run `pnpm run typecheck:libs` before running `pnpm --filter @workspace/api-server run typecheck` — otherwise the api-server sees stale lib declarations and reports "Module '@workspace/db' has no exported member X".
