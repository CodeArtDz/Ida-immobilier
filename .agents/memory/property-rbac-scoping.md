---
name: Property RBAC scoping
description: How agent-role access control is enforced on property endpoints, and why list-only filtering is insufficient
---

# Property RBAC scoping (agent role)

Agents may only access properties they own (`ownerAgentId`) or are currently
responsible for (`currentAgentId`). Broader staff roles (agency_manager and
above) are not scoped — they see/manage everything.

**Why:** Filtering only `GET /properties` (the list) leaves an IDOR hole: every
other property-by-id route (`GET/PATCH/PATCH publish/DELETE`, all `…/media`
write routes, and draft view via `GET /properties/slug/:slug`) was `requireAuth`
only, so an agent could read/edit/delete another agent's property by guessing the
id. RBAC on a list endpoint is never enough — guard every by-id read and mutation.

**How to apply:** In `artifacts/api-server/src/routes/properties.ts` use the
shared helpers `agentMayAccessProperty(user, property)` (pure check) and
`loadPropertyForUser(req, res, id)` (loads + writes 404 missing / 403 forbidden).
Reads return 404 to avoid leaking existence; mutations return 403. Published
properties stay publicly viewable via slug — only block agents from *unpublished*
foreign properties there.

Analytics overview (`/analytics/dashboard`, `/analytics/website`, incl. "Santé
SEO") is superadmin/admin only via `requireRole("superadmin","admin")`. The
"assign agent" route stays `superadmin/admin/agency_manager`; the UI button is
admin/superadmin only — agents are blocked at both layers.
