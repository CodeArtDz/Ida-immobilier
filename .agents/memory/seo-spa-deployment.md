---
name: SEO health score scans production, not dev
description: Why Replit "Santé SEO" can show a low score even when dev SEO is complete
---

# Replit "Santé SEO" score reflects the PUBLISHED deployment, not the dev preview

The SEO health panel ("Santé SEO") scores the **published production site**, not the dev
environment. SEO edits made in dev do NOT change the score until the app is **republished**.

**Why:** A very low score (e.g. 5%) right after adding good SEO in dev almost always means the
production deployment is stale (built before the SEO work) or never deployed. Verify dev is
correct via `curl localhost:80/` (meta tags), `curl localhost:80/robots.txt`,
`curl localhost:80/sitemap.xml`, then tell the user to republish.

**How to apply:** When a user reports a low SEO score, first confirm the served dev HTML and
static files (robots.txt, sitemap.xml, favicon, og image) are correct through the proxy, then
recommend republishing — don't assume the on-page SEO is broken.

## SPA caveat
This is a client-side React/Vite SPA. Per-page `<title>`/description are injected by the
`useSeo` hook (`src/hooks/use-seo.ts`) at runtime; the static `index.html` carries the homepage
defaults + OG/Twitter/JSON-LD. Crawlers that don't run JS see only the index.html defaults, so
keep the static index.html meta strong as the baseline.
