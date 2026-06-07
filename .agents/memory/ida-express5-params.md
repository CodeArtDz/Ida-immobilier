---
name: IDA Immobilier Express 5 params typing
description: Express 5 req.params typing quirk requiring string cast
---

In Express 5 with strict TypeScript, `req.params.someParam` is typed as `string | string[]`. Passing it directly to `parseInt()` causes a TS error.

**Why:** Express 5 broadened the ParamsDictionary value type compared to Express 4.

**How to apply:** Always use `req.params.id as string` (or `String(req.params.id)`) before passing to `parseInt()`. Pattern: `parseInt(req.params.id as string)`. Applied via sed across all route files in this project.
