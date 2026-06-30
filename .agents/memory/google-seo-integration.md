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
- **PageSpeed keyless quota is tiny and shared → frequent 429** even when the
  domain is live and reachable. A 429 is NOT a reachability/domain problem; it's
  the anonymous daily quota. Setting the (free) `PAGESPEED_API_KEY` secret gives a
  dedicated, much higher quota. `fetchPageSpeed` maps 429 → guidance to add the key,
  and 400/500 → "page not publicly accessible". Don't treat 429 as "site down".

## Provisioning gotchas (cost real debugging time)

- **Don't trust the IDs the (non-technical) user typed.** They mix up sites/properties.
  Verify against what the service account can actually reach:
  - GSC: `GET webmasters/v3/sites` → lists exact `siteUrl`s the SA sees.
  - GA4: `GET analyticsadmin/v1beta/accountSummaries` → lists `properties/<id>` + names.
    Requires the **Google Analytics Admin API** enabled in the GCP project (separate
    from the Data API) — otherwise 403 "has not been used in project".
- **GSC domain properties use the `sc-domain:example.com` format**, NOT
  `https://example.com/`. Wrong format → 403 "insufficient permission". A property
  shown as a bare domain (no http) in the GSC UI is a Domain property.
- **GA4 Data API 403 "insufficient permissions for this property"** almost always
  means `GA4_PROPERTY_ID` is the wrong numeric id (not the property the SA was added
  to), not a real permission gap. The web Measurement ID (`G-XXXX`) is NOT the
  numeric property id.
- **The agent cannot fix a secret holding a wrong value.** `setEnvVars` refuses when
  a same-named secret exists (even for non-sensitive config like a property id), and
  there's no agent API to delete a secret. The requestEnvVar form can re-save the old
  pre-filled value if the user doesn't clear it. Resolution: have the user edit/delete
  the value in the **Secrets UI** directly, then verify against the running server.
- **Verify against the running server, not the agent's shell env or `viewEnvVars`.**
  `viewEnvVars` returns booleans for secrets (no value); the long-lived bash shell can
  lag on secret changes. Ground truth = restart api-server, then hit
  `/api/seo/google/status` (it echoes the loaded `propertyId`/`siteUrl`) with a
  disposable staff token.
- **Never let the SA key JSON live in the repo.** When the user pastes the full
  service-account JSON into chat, Replit saves it to `attached_assets/` (a committed
  file) — a credential leak that fails code review. Delete that file immediately
  (`rg -l "private_key|BEGIN PRIVATE KEY" attached_assets/`) and tell the user to
  rotate/revoke the exposed key in GCP, keeping it only in the
  `GOOGLE_SERVICE_ACCOUNT_JSON` secret.
