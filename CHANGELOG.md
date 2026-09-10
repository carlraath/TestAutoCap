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

### Phase 3 - Participant experience (2026-09-10)
- Dashboard, instructions with the verbatim copy, attempt screen with segmented progress, a
  server-authoritative timer that turns amber under two minutes, and autosave debounced within a
  second with a saved indicator that never claims more than the server confirmed.
- Ordering and matching questions operable by drag, by on-screen controls and by keyboard alone.
- Review screen, per-assessment confirmation, and the Training Plan with its A4 print view.

### Phase 4 - Admin reporting and operations (2026-09-10)
- Overview, results with expandable per-participant detail including keys, rationales and source
  anchors, cohort statistics drawn as inline graphics, module demand, item analysis with outlier
  flags, audit log, retire with the slot-depth guard, and close and export producing all four files.
- Deterministic sample cohort generator for demonstrating the reports.

### Phase 5 - Question bank (2026-09-10)
- 65 items authored to the docs/04 blueprints, then reviewed by three independent adversarial
  lenses per item and resolved slot by slot, with every SQL key executed in PostgreSQL and every
  Python key run. Review document and sign-off record in bank/review.
- Pilot run end to end with two internal accounts, drag and drop by mouse and by keyboard, and the
  pilot attempts reset away.

### Phase 6 - Hardening and verification (2026-09-10)
- 284 unit and integration tests; end-to-end suite green on Chromium, Edge, Firefox and WebKit.
- Accessibility: 20 screens audited with axe at WCAG 2.0 and 2.1 A and AA, zero violations, plus a
  keyboard-only pass and a focus-visibility check. Fixed a real contrast failure in the attention
  amber for small text.
- Load: 20 concurrent participants autosaving, polling and submitting for a minute. 2420 requests,
  no failures, p99 73 ms, no answer lost and every attempt submitted exactly once.
- No personal data verified against the schema and all four exports. Two false positives in the
  checker itself were narrowed and covered by tests.

### Phase 7 - Documentation (2026-09-10)
- Participant, Administrator, Hosting and Operations guides in /guides, each verified line by line
  against the built application by an independent reviewer and corrected in place.
- Hosting Guide proven by a clean second deployment from a fresh clone, then torn down. That run
  found and fixed a missing .env.example in the repository.

### Phase 8 - Go-live (2026-09-10)
- The docs/06 go-live checklist executed against a production HTTPS deployment and evidenced line
  by line in docs/evidence/go-live.

### Managed PostgreSQL path (2026-09-10)
- The DATABASE_URL path (Neon, Supabase, Railway, Render) made to work first time for a
  non-technical operator, after finding that a Neon connection string was reaching node-postgres in
  a way that printed a multi-line SECURITY WARNING deprecation notice, and that a hosted connection
  string without `sslmode` connected in plain text and was refused.
- src/db/config.ts decides the target and the TLS setting explicitly: hosted databases get TLS with
  the certificate checked, a database on this machine does not, `sslmode` and `DATABASE_SSL` are
  honoured, and pasted quotes, whitespace and a `psql ` prefix are stripped. The ssl query
  parameters are removed before the string reaches node-postgres.
- src/db/errors.ts turns connection failures into a sentence with something to do about it, keeping
  the original message; DEBUG_DB=1 still prints the stack.
- Every database command now names the database it is about to touch, refuses to build a throwaway
  local database when the connection string is sitting under a mistyped variable name, closes the
  connection pool so it returns to the prompt, and creates DATA_DIR itself.
- Migrations on managed PostgreSQL run inside a transaction behind a transaction-scoped advisory
  lock, so concurrent serverless cold starts cannot half-create the schema.
- 314 unit and integration tests.

