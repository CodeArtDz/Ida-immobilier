---
name: Testing auth-gated routes against the live dev DB
description: How to e2e-test token-auth routes when live DB users diverge from the seed credentials in replit.md
---

The dev Postgres holds real/custom data that does NOT match the seed credentials in `replit.md` (the `@ida-immobilier.fr` logins and the documented passwords often don't exist). Some `properties.owner_agent_id` values even point to user ids that no longer exist, so `agentName` can come back null — a pre-existing data inconsistency, not a bug in new code.

**Why:** the seed script (`scripts/src/seed.ts`) inserts fresh rows (no upsert for users/properties), so re-running it duplicates data; and the team has hand-edited the DB since seeding.

**How to test auth-gated routes:** create a disposable admin directly in the DB, get a token via `/api/auth/login`, run the curl tests through the proxy (`localhost:80/api/...`), then delete the temp user and revert any rows you touched.

- Password hash format is `salt:hexkey` where `key = scrypt(password, salt, 64)` and `salt = randomBytes(16).toString("hex")` (see `artifacts/api-server/src/lib/auth.ts`).
- Generate with node, `insert ... on conflict (email) do update`, login, test, then `delete from users where email='...'`.
- Always restore any production-like rows you mutated (e.g. reset a property's owner/current agent ids) so the user's data is left untouched.
