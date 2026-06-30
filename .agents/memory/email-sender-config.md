---
name: Email sender config (EMAIL_FROM)
description: Why the From address comes from EMAIL_FROM (not the connector), the sandbox-default trap, and how to verify a deployment
---

# Email sender configuration

The mailer's `from` address is **always** `process.env.EMAIL_FROM` on both transports — the Replit Resend connector proxy does NOT override it with the connector's own configured `from_email`. The connector only supplies the API key/auth.

- **The trap:** `EMAIL_FROM` defaults to the Resend sandbox sender `onboarding@resend.dev`, which Resend only delivers to the account owner. So if `EMAIL_FROM` is unset, every client-facing email silently no-ops for real recipients on **both** Replit and Vercel — not just Vercel.
- **Verified sender:** the Resend account has `ida-immobilier.com` verified; use `I.D.A Immobilier <contact@ida-immobilier.com>`. Set `EMAIL_FROM` to this in every environment (Replit shared env + Vercel project env).
- **Why:** the goal is real delivery to clients (leads, appointment updates, property alerts); the sandbox default looks like it works (sends "succeed" to the owner) but drops everyone else.

**How to apply / verify:** `logEmailConfig()` runs at app load (in `app.ts`, so also on each Vercel cold start) and logs the active transport + sender:
- `"Email configured"` (INFO) → wired correctly.
- WARN "using the Resend sandbox sender" → `EMAIL_FROM` unset/sandbox; fix it.
- ERROR "running on Vercel but RESEND_API_KEY is not set" → set the key in Vercel.

A safe end-to-end pipeline test (no real person emailed): POST to `https://api.resend.com/emails` with the Resend key, `to: ["delivered@resend.dev"]` (Resend's delivery test sink). A 200 + id confirms the key works AND the `from` domain is verified (an unverified domain returns 403).
