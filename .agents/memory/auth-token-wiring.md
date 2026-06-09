---
name: Auth token wiring & persistence
description: Token-based auth wiring requirements and why tokens must be DB-backed, not in-memory
---

# Auth token wiring & persistence

## Frontend token getter
`setAuthTokenGetter` must be called in `main.tsx` for token-based auth; without it all API calls return 401.

## Tokens MUST be persisted in the DB, not an in-memory Map
The auth token store lives in the `sessions` table (token PK, user_id FK→users ON DELETE CASCADE, created_at). `storeToken`/`revokeToken`/`getUserFromToken` in `artifacts/api-server/src/lib/auth.ts` are async DB ops.

**Why:** Replit production is an **autoscale** deployment. An in-memory `Map<token,userId>` is wiped on every cold-start/restart and is not shared across instances. The symptom is subtle: uploads, images (public `/api/storage/objects/*`), and writes all succeed, but `/api/auth/me` returns 401 after the instance recycles → the frontend `user` object becomes null → the whole authed UI (e.g. admin avatar, dashboard) silently disappears. It looks like "my profile picture won't show" but the real cause is lost auth state.

**How to apply:** Never store sessions/tokens in process memory for anything that deploys to autoscale. Use the DB (or JWT). When adding the `sessions` table, the prod table is created automatically by the Replit Publish schema-diff flow — do NOT hand-write a prod migration. User must Publish for the fix to take effect.
