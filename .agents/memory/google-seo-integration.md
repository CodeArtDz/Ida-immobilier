---
name: Google SEO/Analytics integration model
description: How the SEO dashboard connects to Google (no Replit connector exists) — read before changing GSC/GA/PageSpeed wiring.
---

# Google Search Console / Analytics / PageSpeed wiring

There is **no Replit connector** for Google Search Console or Google Analytics
(the available Google connectors are Calendar/Docs/Drive/Gmail/Sheets/Play only).

**Decision:** the SEO dashboard authenticates server-side with a Google Cloud
**service account** (not OAuth, not a connector). Credentials come from secrets:
- `GOOGLE_SERVICE_ACCOUNT_JSON` — full service-account key JSON (plain or base64)
- `GSC_SITE_URL` — verified Search Console property (`https://…/` or `sc-domain:…`)
- `GA4_PROPERTY_ID` — numeric GA4 property id
- `PAGESPEED_API_KEY` — optional, raises PageSpeed quota (PageSpeed works keyless)

**Why:** the task asked for "Google via Replit connectors" but no such connector
exists; service-account secrets are the only viable path and keep the internal
SEO audit working standalone with zero config.

**How to apply:**
- Tokens are minted with `google-auth-library`'s `JWT` (already an api-server dep);
  REST calls go to searchconsole/analyticsdata/pagespeedonline endpoints directly.
- Every Google helper degrades gracefully: returns `connected:false` /
  `available:false` (+ optional `error`) instead of throwing, so the dashboard
  renders a guided-setup card until the secrets are added.
- The service-account email must be granted read access inside Search Console
  (Users & permissions) and GA4 (Property Access Management) — adding the secret
  alone is not enough.
- PageSpeed needs a publicly reachable URL (`SITE_DOMAIN`); it returns
  unavailable in dev / before the public domain is live.
