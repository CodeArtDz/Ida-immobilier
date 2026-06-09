---
name: Vercel dual-platform deployment
description: Decisions for keeping the app deployable on both Replit and Vercel
---

The app must run unchanged on **both** Replit and Vercel.

**Rule: choose platform behavior at runtime via env vars, never fork code per host.**
A storage facade selects the backend by env (`BLOB_READ_WRITE_TOKEN` /
`STORAGE_PROVIDER=vercel` → Vercel Blob, else Replit GCS); routes and frontend
depend on the interface, not a concrete provider.

**Why a single server-multipart upload path.** Replit's avatar flow used
presigned client-PUT (GCS-specific) with no clean Vercel Blob equivalent, so all
client uploads were unified onto one server-side multipart endpoint that works on
both backends. The legacy presigned route is gated to the Replit provider and
returns a controlled 501 elsewhere (don't let it throw an opaque 500 on Vercel).

**Why a URL resolver.** Stored values differ by backend (GCS → relative
`/objects/...` served via `/api/storage`; Blob → absolute CDN URL). A resolver on
both ends normalizes them so render sites don't care which backend produced them.

**Serverless constraints that bit us (the durable gotchas):**
- Vercel request body cap ~4.5 MB → avatar client limit lowered to 4 MB; large
  property media can fail on Vercel only.
- Each serverless instance gets its own pg pool → set `max: 1` under
  `process.env.VERCEL` or you exhaust Postgres connections.
- Build tooling that hard-required Replit-only envs (`PORT`/`BASE_PATH`) must
  have defaults, or a plain off-Replit `vite build` throws before bundling.
- **Do NOT let `@vercel/node` compile a `.ts` function for this monorepo.** It
  type-checks with a nodenext config that conflicts with the repo's bundler
  resolution (`moduleResolution: bundler` + `customConditions: ["workspace"]`,
  which resolve `@workspace/*` to `.ts` source) → TS2834 (needs `.js`
  extensions), Express `.use` missing, pino-http "no call signatures", etc.
  Instead pre-bundle the API with the existing esbuild pipeline
  (`src/serverless.ts` → `dist/serverless.mjs`) and make the Vercel function a
  plain `.mjs` re-export so no TS is type-checked by the platform. Native
  externals (sharp, pdf-parse, @google-cloud) are kept external and traced by nft.

**Cross-platform media caveat (documented, not solved):** with a shared DB, an
image uploaded on one platform won't load on the other — legacy `/objects/` only
resolves on Replit; Blob URLs only exist after a Vercel upload.
