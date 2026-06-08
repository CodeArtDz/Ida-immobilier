---
name: Appointment update emails
description: How/where appointment confirm/reschedule/refuse notifications are sent and to whom
---

# Appointment update notifications

When staff confirm / reschedule / refuse an appointment via `PATCH /appointments/:id`, the server emails the requester.

- **Recipient = the original requester's address**: use the pre-update `clientEmail` column (`existing.clientEmail`), falling back to the linked account email — NEVER an address taken from the PATCH payload.
  - **Why:** the goal is "email the address they used to request it"; a staff payload could carry a different/edited `clientEmail` and misdirect the notification.
- **Email kind** is derived, not passed: status→confirmed = "confirmed", status→cancelled = "cancelled", else a changed `scheduledAt` (and not cancelled) = "rescheduled".
- Sending is via `sendAppointmentUpdateEmail` in `artifacts/api-server/src/lib/mailer.ts` (branded navy/gold template).
- **SMTP must be configured for delivery.** With no `SMTP_HOST/SMTP_USER/SMTP_PASS/EMAIL_FROM` env, the mailer logs a warning and returns false — the PATCH still succeeds. So "appointment updated but no email arrived" usually means SMTP is unset, not a bug.
- PATCH and DELETE on appointments are staff-only (`requireRole`); POST stays `requireAuth` (clients book from annonce.tsx); GET stays `requireAuth`.

## Known pre-existing gap (not yet fixed)
`GET /appointments` is `requireAuth` only with no per-user scoping, so a logged-in client's read-only page can receive other clients' appointments. Fixing requires backend scoping by `req.user` (clientId for clients, agency/ownership for agents). Flagged but out of scope of the confirm/reschedule/refuse task.
