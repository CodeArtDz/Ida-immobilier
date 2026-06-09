// Serverless entry point (Vercel). Unlike `index.ts`, this never calls
// `app.listen()` — the serverless platform invokes the exported Express app as
// the request handler directly. Bundled by esbuild (see build.mjs) into
// `dist/serverless.mjs`, which the Vercel function (`api/[...path].mjs`)
// re-exports. This keeps the platform from type-checking our TS source with an
// incompatible config.
import app from "./app";

export default app;
