# Changelog

All notable changes to Avec / Capability Placement. Dates are Australia/Melbourne.

## Unreleased

### Phase 0 - Plan and scaffold (2026-09-09)
- Implementation plan, stack confirmation and open questions in docs/plan/implementation-plan.md.
- Brand tokens derived from https://www.avecglobal.com and recorded in docs/plan/brand-tokens.md; logo, gradient, favicon and Inter font files vendored under public/.
- Next.js 16 (App Router, TypeScript strict, Tailwind 4) scaffold with typecheck, lint and test scripts.
- Engine contracts (types and assessment structure), database schema and first migration.
- HTTPS server entry point and self-signed certificate script for self-hosted deployment.

### Phase 1 - Auth and participant management (2026-09-09)
- Admin bootstrap from ADMIN_USERNAME and ADMIN_PASSWORD (scripts/seed.ts), idempotent, audited.
- Login with iron-session signed httpOnly cookies (8 h, sliding via src/proxy.ts), bcryptjs cost 12, generic failure message, DB-backed rate limiting (10 failures per 15 minutes per account and per IP).
- Bulk participant creation (participant-01..NN) with generated three-word passwords and the one-time Allocation Register CSV; participant list with per-assessment status, reset counts and last activity; password regeneration; admin password rotation.
- Audit log foundations (every state-changing admin action and participant attempt event).
- 40 unit and integration tests.

### Phase 2 - Engine and attempt lifecycle (2026-09-09 to 2026-09-10)
- Engine: SHA-256 seed, sfc32 PRNG, Fisher-Yates shuffles, per-slot draw, presentation order, option order, ordering initial arrangement with the never-serve-the-key rule, matching tray order; scoring for all four item types with no partial credit; thresholds; prescription mapping and reporting shorthand; Training Plan totals; bank validator; dev sample bank (65 items).
- Lifecycle: start (one attempt, unique index), autosave including partial matching placements, server-authoritative timer with expiry finalisation on contact and sweep, idempotent submit, resume, reset with full archive; JSON API for attempt view, autosave and submit.
- Assessment components: single, multi, ordering (drag and drop plus Move up/down and keyboard lift/move/drop), matching (drag and drop plus per-token selector), timer chip (amber under two minutes), progress bar, review tiles, saved indicator.
- 236 unit and integration tests; adversarial lifecycle review with fixes.
