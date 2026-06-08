---
name: Estimation & notification authz
description: Access-control and notification-fanout rules for the estimations and notifications API surface
---

# Estimation & notification access control

- **Estimation admin endpoints** (`GET /estimations`, `GET /estimations/:id`, `PATCH /estimations/:id`) must use `requireAuth, requireRole("superadmin","admin","agency_manager","agent")`. `requireAuth` alone is NOT enough — clients are authenticated too and would otherwise read/modify lead PII.
- `POST /estimations` stays on `optionalAuth` — it is the public estimation submission form.
- **Notification ownership**: `PATCH /notifications/:id/read` must filter by BOTH `id` AND `userId` (the authenticated user). Filtering by id alone is an IDOR — any user could mark another user's notification read.

## Notification fanout
- There is no estimation-specific value in the notification_type enum — reuse `"new_lead"` for new estimation alerts.
- On new estimation, fan out one notification row per active staff user (roles superadmin/admin/agency_manager/agent, `isActive = true`). Wrap the insert in try/catch and log on failure so a notification error never breaks the public submission.

**Why:** architect review caught both authz gaps when the notification feature first wired up these endpoints; the live DB had no agency_manager user, so test staff = superadmin + admin + 2 agents = 4 notifications.
