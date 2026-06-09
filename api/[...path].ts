// Vercel serverless entry point.
//
// Vercel routes every request under `/api/*` to this catch-all function. The
// Express app already mounts its router at `/api`, and Vercel passes the full
// original URL (including the `/api` prefix), so the app matches routes
// unchanged. `@vercel/node` bundles the TS source (including the
// `@workspace/*` packages, which export `.ts`) with esbuild, mirroring how the
// api-server is bundled on Replit.
import app from "../artifacts/api-server/src/app";

export default app;
