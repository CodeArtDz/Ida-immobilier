---
name: IDA Immobilier auth architecture
description: Token-based auth design and production upgrade path
---

Auth uses `crypto.scrypt` for password hashing (salt:hash format) and stores session tokens in an in-memory Map<string, userId>.

**Why:** Simple, zero-dependency MVP auth. No JWT library needed. Works for single-instance deployment (which Replit deployments are).

**How to apply:** To upgrade for multi-instance: replace the in-memory Map with Redis using ioredis, or switch to JWT with jose library. The `requireAuth`, `optionalAuth`, and `requireRole` middleware are in `artifacts/api-server/src/lib/auth.ts`.

Token is sent as `Authorization: Bearer <token>` header. Frontend stores it in localStorage and reads it in the Orval-generated axios instance interceptor.
