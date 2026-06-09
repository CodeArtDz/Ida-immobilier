// Vercel serverless entry point.
//
// This is intentionally a plain `.mjs` file (not `.ts`): it re-exports the
// pre-bundled Express app produced by the api-server esbuild build
// (`pnpm run vercel-build`). Because the function itself contains no TypeScript,
// the Vercel Node builder never type-checks our source with an incompatible
// config — all workspace resolution and native externals are already handled by
// our own esbuild pipeline.
//
// Vercel routes every request under `/api/*` to this catch-all. The Express app
// mounts its router at `/api`, and Vercel preserves the `/api` prefix, so routes
// match unchanged.
export { default } from "../artifacts/api-server/dist/serverless.mjs";
