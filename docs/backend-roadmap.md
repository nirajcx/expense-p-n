# Backend practice roadmap

Goal: tum implementation likhoge; review mein hum decisions, bugs aur tradeoffs discuss karenge. Same concepts ko pehle ek backend mein samjho, phir doosre mein independently implement karo.

## Current starter

Node now includes Drizzle users/expenses models, timestamp triggers, a local demo seed, validated/paginated GET expenses and shared error/response utilities. Session auth is still pending; the fixed demo identity works only in development. FastAPI remains a health/DB skeleton. Extend these models yourself as the next exercise.

## 1. Design before CRUD

Draw relationships for users, expenses, categories, sessions and admin audit events. Decide which categories are global versus user-owned.

Expense design checklist (review the initial Node schema, then extend it and design the FastAPI equivalent): owner, amount, currency, category, reason/description, spent-for person or purpose, payment method, expense date, created_at and updated_at. Clarify how reason differs from spent-for. Use fixed precision `NUMERIC` or integer minor units for money, not floating point; don't sum different currencies without a conversion policy. Store timestamps as `TIMESTAMPTZ`; remember that `updated_at` needs explicit update logic or a trigger. Expense date and record creation time are different.

Add primary keys, foreign keys, positive-amount constraints, normalized unique email and indexes based on queries (e.g. owner + expense date). Think about delete behavior and retention before writing cascading deletes. Never accept an expense owner from untrusted input when it should come from the session.

Deliverable: your proposed tables + why each relationship exists. Then write the first migration in each backend.

## 2. HTTP foundations

Implement input validation, body-size limits, consistent safe errors, request IDs, redacted structured logs, security headers and rate limiting. Configure explicit frontend origins when frontend work starts. Cookie requests need credential-aware CORS; CORS alone is not CSRF protection. Configure proxy trust only for a known deployment topology.

Deliverable: invalid input produces a predictable response without stack traces or credentials. Test behavior, not just that functions were called.

## 3. Server-side session auth

Study the flow: password verification → new unpredictable session ID → persistent server-side session record → browser cookie → session lookup on every authenticated request. Store only an opaque identifier in the cookie. A signed cookie containing all auth state alone cannot give you immediate central revocation.

Plan Argon2id password hashing, normalized email uniqueness, login throttling, generic login failure responses and session rotation at login/privilege changes. Don't log passwords, session tokens or cookies. Use different cookie names for Node and FastAPI because localhost cookies are not isolated by port.

Node: evaluate `express-session` plus a maintained PostgreSQL-backed store. Its default MemoryStore is unsuitable for production. FastAPI: design a persistent opaque-token session store; signed-cookie middleware alone doesn't provide the desired central session control. If designing your own token table, store token hashes, not raw bearer tokens.

Use HttpOnly cookies, Secure in production, appropriate SameSite, narrow cookie scope, idle timeout and absolute expiry. Add CSRF protection for state-changing cookie-authenticated requests; never use GET for mutations. Run expiry cleanup. Logout must revoke server-side state and clear the cookie.

Deliverable: signup, login, current user and logout, with tests for invalid passwords, expiry, revocation and fixation prevention. Session rows must be independently identifiable by user so logout-all can revoke them immediately.

## 4. Ownership and roles

Define permissions before UI: user manages own expenses; admin gets only explicitly assigned permissions; superadmin can inspect users/expenses, edit permitted details and revoke one or all sessions. Re-check active user status and privileges server-side so demotion/disablement doesn't leave old privileged sessions usable.

Every expense lookup/update/delete must enforce ownership or an explicit privileged policy. Test by trying another user's expense ID. Superadmin does not need to see password hashes, raw sessions or other secrets. Never let signup or profile updates assign roles. Bootstrap the first superadmin through a controlled CLI/manual process, not a public endpoint.

Record privileged changes in an append-only audit trail: actor, target, action, safe before/after data, time and request ID. Protect against mass assignment and accidental removal of the last superadmin. Define what a revoked in-flight request is allowed to finish; check authorization again within sensitive transactions if necessary.

## 5. Expense features and verification

Implement create/list/detail/update/delete, category policy, pagination, filters, totals and transaction boundaries. Test with real dedicated test databases, never destructive resets of development databases. Cover two users, permission boundaries, amount precision, invalid categories, rollback, session expiry and superadmin logout-all.

Before deployment: least-privilege runtime DB roles, separate migration credentials, HTTPS, backups/restore rehearsal, managed secrets, dependency review, operational logging and CI. These are later milestones, not claims that this starter is production-ready.
