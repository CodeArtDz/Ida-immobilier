# I.D.A Immobilier

A production-ready French luxury real estate platform for I.D.A Immobilier (Marignane, Provence). Full-stack: React+Vite frontend with deep navy/gold branding, Express 5 API, PostgreSQL/Drizzle ORM backend.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/ida-immobilier run dev` — run the frontend (port 23125, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed the database with initial data
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18, Vite 7, wouter, TanStack Query, framer-motion, recharts
- API: Express 5 (port 8080)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Fonts: Cinzel (headings) + Inter (body) via Google Fonts
- Auth: Token-based (crypto.scrypt hashing, in-memory Map store)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for API contract (endpoints, types)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `lib/db/src/schema/` — Drizzle table definitions (one file per domain)
- `lib/db/src/index.ts` — DB client export + re-exports all schema tables
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/api-server/src/lib/auth.ts` — token auth helpers (hash, verify, requireAuth)
- `artifacts/ida-immobilier/src/pages/` — React pages (public, client/, admin/)
- `artifacts/ida-immobilier/src/components/layouts/` — Public, Admin, Client layouts
- `artifacts/ida-immobilier/src/contexts/auth.tsx` — AuthProvider with useAuth hook
- `scripts/src/seed.ts` — database seed script

## Architecture decisions

- Token-based auth with `crypto.scrypt` (not JWT) — simpler for MVP, tokens stored in-memory Map on the server. Suitable for single-instance deployment; replace with Redis/JWT for multi-instance production.
- All API routes share the `/api` prefix (e.g. `/api/properties`, `/api/auth/login`) — mounted via the shared reverse proxy.
- Numeric DB fields (salePrice, rentalPrice, etc.) are Drizzle `numeric` type — returned as strings from PostgreSQL driver. Routes parse them with `parseFloat()` before sending JSON.
- Property listings show Unsplash placeholder images; production should use an actual media upload service (S3, Cloudinary, etc.).
- Role hierarchy: superadmin → admin → agency_manager → agent → client. Enforced server-side via `requireRole()` middleware.

## Product

- **Public portal**: Homepage with hero, property search, featured listings by city, estimation CTA. Search pages (acheter/louer) with filters. Property detail with DPE badges, agent contact form, similar listings.
- **Estimation**: Multi-step form (location → characteristics → contact) submitted to lead pipeline.
- **Client portal** (/espace-client): Favorites, saved search alerts, appointments, messaging.
- **Admin/Agent dashboard** (/tableau-de-bord): Analytics, property management (CRUD + publish), leads pipeline, appointments, estimation requests, user and agency management.

## Seed credentials

| Role       | Email                              | Password       |
|------------|------------------------------------|----------------|
| Superadmin | superadmin@ida-immobilier.fr       | superadmin123  |
| Admin      | admin@ida-immobilier.fr            | admin123       |
| Manager    | manager@ida-immobilier.fr          | manager123     |
| Agent 1    | agent1@ida-immobilier.fr           | agent123       |
| Agent 2    | agent2@ida-immobilier.fr           | agent123       |
| Client 1   | client1@example.fr                 | client123      |
| Client 2   | client2@example.fr                 | client123      |

## Vercel deployment (dual-platform)

The app runs on both Replit and Vercel. Platform-specific behavior is selected at runtime by environment variables — no code branches per host.

- **Storage**: A facade (`artifacts/api-server/src/lib/storage.ts`) picks the backend. `BLOB_READ_WRITE_TOKEN` present (or `STORAGE_PROVIDER=vercel`) → Vercel Blob; otherwise Replit GCS. Both implement the same `StorageService` interface (`uploadBuffer`, `toPublicUrl`, `serveObject`, `servePublicObject`).
- **Uploads**: All client uploads go through the portable server-multipart endpoint `POST /api/storage/uploads` (multer memory → active backend → public URL). The legacy presigned `request-url` route is kept Replit-only.
- **URL resolution**: `artifacts/ida-immobilier/src/lib/storage-url.ts` `resolveStorageUrl()` renders stored values across backends — absolute Blob URLs pass through, legacy `/objects/...` get the `/api/storage` prefix.
- **Serverless wiring**: `vercel.json` (build via `pnpm run vercel-build`, output `artifacts/ida-immobilier/dist/public`, SPA rewrite excluding `/api`), `api/[...path].ts` (catch-all that exports the Express app; `@vercel/node` bundles the TS-source workspace libs), root `vercel-build` script. DB pool shrinks to `max: 1` when `process.env.VERCEL` is set.

### Vercel env vars

`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `SESSION_SECRET`, `RESEND_API_KEY`. Optionally `STORAGE_PROVIDER` to force a backend.

### Known limitations

- **Body size**: Vercel serverless caps request bodies at ~4.5 MB. Avatar uploads are limited to 4 MB client-side; property media larger than ~4.5 MB will fail on Vercel (works on Replit).
- **Cross-platform media**: With a shared DB, images uploaded on one platform won't load on the other (legacy `/objects/...` paths only resolve on Replit; Blob URLs only exist after a Vercel upload).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After adding new schema tables to `lib/db/src/schema/`, run `pnpm run typecheck:libs` to rebuild lib declarations before typechecking `api-server`. Missing table exports usually mean stale lib declarations.
- When adding new routes, register them in `artifacts/api-server/src/routes/index.ts`.
- Express 5 `req.params` values require `as string` cast when passed to `parseInt()` — TypeScript sees them as `string | string[]`.
- DB numeric fields come out as strings from pg driver — always `parseFloat()` before returning from routes.
- Do not run `pnpm dev` at workspace root. Use `restart_workflow` to restart services.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
