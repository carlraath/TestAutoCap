# Implementation plan (Phase 0 deliverable)

Prepared 2026-09-09 against docs/06. Approved on the owner's behalf under the overnight mandate; see DECISIONS.md.

## 1. Plan by phase

| Phase | Scope | Acceptance evidence |
|---|---|---|
| 0 Plan and scaffold | This plan, brand token sheet, Next.js 16 scaffold with typecheck/lint/test scripts, brand assets vendored, branded hello page served over HTTPS. | `npm run check` green; hello page screenshot over https://localhost:3443. |
| 1 Auth and participants | Admin bootstrap from env; login with rate limiting and generic errors; iron-session cookies (8 h sliding, httpOnly, secure); bulk creation of participant-01..NN with generated three-word passwords; one-time Allocation Register CSV; participant list with statuses, reset counts, last activity; password regeneration; audit log foundations. | 15 participants created, register CSV downloaded, one participant logs in; schema dump shows no personal-data fields. |
| 2 Engine and lifecycle | Pure engine (seed, PRNG, paper, arrangements, scoring, thresholds, prescription mapping) with exhaustive unit tests; bank loader with a dev sample bank covering all four types; attempt lifecycle service (start, autosave with partial arrangements, server-authoritative timer and expiry finalisation, one attempt, resume, idempotent submit, reset with archive). | Unit tests: determinism, four scoring rules, never-serve-the-key, every mapping row, expiry. Integration tests: lifecycle incl. reset, resume, partial autosave. |
| 3 Participant experience | Login, dashboard, instructions (verbatim copy), attempt screen with segmented progress and timer chip (amber under 2 min), single/multi tiles, ordering and matching with drag and drop plus full keyboard alternatives, review screen, confirmations, Training Plan with print stylesheet. | Full three-assessment run on the deployed app; keyboard-only ordering and matching; refresh mid-attempt loses nothing; A4 print; side-by-side brand comparison. |
| 4 Admin reporting and operations | Overview dashboard, results table with expandable detail, cohort statistics (inline SVG), module demand summary, item analysis with outlier flags, audit log view, retire with slot-depth guard, close and export (results CSV, item analysis CSV, audit CSV, JSON archive). | Every report against seeded sample data; every export opens cleanly with participant codes only. |
| 5 Question bank | Generate per docs/04 (per-slot rule), review document with self-checks, adversarial review as sign-off, load, freeze bankVersion, pilot with two internal accounts by mouse and by keyboard, reset pilot attempts away. | bank/bank.v1.json, bank/review/*.md, pilot Training Plans. |
| 6 Hardening | Full automated pass, error states, 20-concurrent load sanity, accessibility pass (keyboard-only, focus, AA), cross-browser (Chromium, Edge, WebKit, Firefox via Playwright), no-PII verification of schema and every export. | Test output, pass notes, fixes re-run until clean. |
| 7 Documentation | Participant, Administrator, Hosting and Operations guides in /guides, each verified line by line; Hosting Guide proven by a clean second deployment following only its steps, then torn down. | guides/*.md, second-deployment log. |
| 8 Go-live | Execute the docs/06 checklist on production and evidence each line. | Evidence log in docs/go-live-evidence.md. |

## 2. Stack and hosting confirmation

- Next.js 16.3 App Router, React 19, TypeScript 5.9 strict, Tailwind 4: as recommended.
- Drizzle ORM (pg-core) with one schema and two drivers: `pg` for managed Postgres (Neon primary), PGlite embedded Postgres for local, tests and single-process hosting. Substitution justified in one line: one dialect and one migration set everywhere, zero local install.
- iron-session for signed encrypted httpOnly cookies: the maintained session library docs/06 asks for.
- bcryptjs cost 12: allowed by docs/02, no native build.
- @dnd-kit for drag and drop: pointer, touch and keyboard sensors in one maintained library.
- react-markdown + remark-gfm for stems (fenced code and pipe tables), rendered server-side, no raw HTML.
- Vitest (unit, integration on in-memory PGlite), Playwright (end to end across Chromium, Firefox, WebKit and Edge), axe-core for the accessibility pass, autocannon for the 20-concurrent sanity check.
- Hosting: primary Vercel + Neon per docs/06; second path a single Node HTTPS process with PGlite on a persistent volume (Railway, Render, Fly, a VM, or a laptop). The second path is the one proven in this build because no cloud credentials were available; see DECISIONS.md #4 including the Vercel Hobby non-commercial caveat.
- Cost: zero on the self-hosted path (own machine) or on Neon free tier; Vercel Hobby free but non-commercial; Railway or Render at a few dollars for the fortnight. Stated in the Hosting Guide.

## 3. Brand token sheet

See docs/plan/brand-tokens.md.

## 4. Open questions with recommended defaults (all marked CONFIRM in the docs)

1. Application name and title device: "Avec Capability Placement" shown as "Avec / Capability Placement". Default kept.
2. Thresholds (docs/03 table): kept as stated.
3. Designated drag and drop slots: TA slot 2 ordering, TA slot 9 matching. Kept.
4. Primary hosting path: Vercel + Neon as the documented primary; self-hosted HTTPS + PGlite as the proven fallback. Owner to choose at first real deployment; both are one command.
5. Bank total: docs/04 says 66 but the per-slot rule gives 65. Recommend 65 (rule is authoritative); add a 66th only if the owner names the slot.
6. Session sliding refresh happens on every authenticated request; absolute cap none (docs/02 says sliding 8 h). Kept literal.
7. Rate limit: 10 failed attempts per 15 minutes per account and per IP, counted on failures only, generic message. Kept literal.
8. Time display: Australia/Melbourne with UTC storage. Kept.
