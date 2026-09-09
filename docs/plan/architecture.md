# Architecture and working contract

This is the binding contract for everyone (human or agent) building this application. Read CLAUDE.md and docs/01 to 06 first. This file says how the code is laid out, who owns what, and the exact behaviour of the shared seams.

## Non-negotiables

- TypeScript strict. `npm run check` (typecheck, lint, unit and integration tests) must pass before any commit.
- UK English in all user-facing copy. No emojis anywhere. No client name anywhere.
- No personal data: no name, email, phone or free-text profile fields, ever. Participants are `participant-NN` with display name `Participant N`.
- No external calls at runtime from the participant flow. No analytics, no CDNs, no third-party fonts. All assets under `public/`.
- Keys, rationales and source anchors never leave the server. Client-facing item shapes are the `Served*` types in `src/engine/types.ts`.
- Server-authoritative time. Clients display; the server decides.
- Do not edit `package.json` dependencies. If something is missing, say so in your report.
- Do not touch files outside the folders you own (see ownership) except to add an import.

## Layout

```
src/
  app/                         Next.js App Router (routes below)
  engine/                      Pure functions, no IO. types.ts and structure.ts are the contracts.
  db/                          Drizzle schema (pg-core), migrations, client factory (pg or PGlite)
  lib/                         Server-side services: auth, passwords, rate limit, audit, attempts, reports, csv, time
  components/brand             AvecLogo, AppHeader, AppFooter
  components/ui                Buttons, cards, dialogs, status pills, tables (shared primitives)
  components/assessment        Participant interaction components (single, multi, ordering, matching, timer, progress, review tiles)
  components/admin             Admin tables and charts (inline SVG only)
bank/                          bank.v1.json (frozen bank), dev-sample.json (Phase 2 fixture), review/ (review docs)
tests/unit                     Vitest, engine and pure helpers
tests/integration              Vitest against in-memory PGlite (createMemoryDb)
tests/e2e                      Playwright
scripts/                       migrate, seed, load-bank, teardown, no-pii-check, gen-cert
server/https.ts                Self-hosted TLS entry point
guides/                        The four guides
```

## Routes

Participant (role `participant`):
- `/login`
- `/` redirects by role (participant to `/dashboard`, admin to `/admin`, anonymous to `/login`)
- `/dashboard` three assessment cards; becomes the Training Plan (`/plan` content) once all three are submitted
- `/assessment/[id]/instructions` verbatim copy and the start button (`id` is `ta`, `sql` or `python`)
- `/assessment/[id]/attempt` one question at a time, `?q=N`
- `/assessment/[id]/review`
- `/assessment/[id]/submitted`
- `/plan` the Training Plan with Print button

Admin (role `admin`):
- `/admin` overview dashboard
- `/admin/participants` list, bulk create, regenerate password, reset
- `/admin/results` table; `/admin/results/[userId]` expanded detail
- `/admin/statistics` cohort statistics
- `/admin/demand` module demand summary
- `/admin/items` item analysis with retire
- `/admin/audit` audit log
- `/admin/export` close and export
- `/admin/account` rotate admin password

API (route handlers, JSON):
- `GET /api/health` returns `{ ok: true }` once the database answers
- `GET /api/attempts/[id]` current attempt state for the participant (served items, answers, endAt, serverNow)
- `PUT /api/attempts/[id]/answers/[itemId]` autosave one answer (body is an `Answer`); returns `{ savedAt, status }`
- `POST /api/attempts/[id]/submit` idempotent submit
- Admin mutations are Server Actions in `src/app/admin/**/actions.ts`, each writing an audit row.

## Sessions and auth (src/lib/auth.ts)

- iron-session, cookie name `cp_session`, ttl 8 h, refreshed (sliding) on every authenticated request by `src/proxy.ts`. Cookie httpOnly, sameSite lax, secure when `APP_URL` starts with https.
- Session payload: `{ userId, username, role, participantNumber }`.
- `requireUser()`, `requireAdmin()`, `requireParticipant()` helpers for server components and actions; they redirect to `/login` or return 403.
- Passwords: bcryptjs cost 12. Generated passwords: three random words from `src/lib/wordlist.ts` plus two to three digits, joined with hyphens, 14 characters minimum, for example `harbour-copper-lantern-42`.
- Rate limit (src/lib/rate-limit.ts): 10 failed attempts per rolling 15 minutes per username and per IP, checked before password verification; on limit, the same generic failure message as a wrong password. Successful login clears nothing (the window simply rolls). Rows older than 24 h are deleted opportunistically.
- Login failure message, verbatim: "That participant code and password do not match."

## Audit (src/lib/audit.ts)

`audit(db, actor, action, { targetType, targetId, reason, details })`. Actions: `admin.bootstrap`, `admin.password_rotated`, `participants.bulk_created`, `participant.password_regenerated`, `attempt.reset`, `item.retired`, `exercise.closed`, `export.created`, `attempt.started`, `attempt.submitted`, `attempt.auto_submitted`. Participant events are recorded with the participant as actor.

## Engine (src/engine)

- `seed.ts`: `computeSeed(inputs)` = SHA-256 hex of `${userId}:${assessmentId}:${attemptNumber}:${bankVersion}`. `createRng(seedHex)` = sfc32 seeded from the first 16 bytes (4 big-endian uint32), `next()` in [0, 1), `nextInt(n)` = floor(next() * n). `shuffle(array, rng)` is Fisher-Yates from the end (`for i = n-1 down to 1: j = nextInt(i+1); swap`).
- `paper.ts`: `generatePaper(inputs, items)` consumes the rng in this exact order: for each slot ascending, draw `candidates[nextInt(candidates.length)]` where candidates are the non-retired items in that slot sorted by id; then shuffle the picked ids for served order; then for each served item in served order: single/multi option ids shuffled unless `fixedOrder`; ordering elements shuffled and, if equal to the key, replaced by the next lexicographic permutation (by authored element index, wrapping to the first permutation); matching token ids shuffled for the tray. Throws if any slot has no candidates.
- `serve.ts`: `toServedItem(item, presentation)` strips keys and applies the presentation order.
- `scoring.ts`: `scoreItem(item, answer)` returns 0 or 1 per docs/03; `scoreSections(assessment, items, answers)` returns `SectionScore[]`.
- `prescription.ts`: `prescribe(sectionMet)` returns `ModulePrescription[]` for all seven modules in recommended sequence; `shorthand(prescriptions)` returns P1 to P4 or null; `buildTrainingPlan(prescriptions)` totals Prescribed hours.
- `bank.ts`: `validateBank(bank)` enforces docs/04 structural rules (option counts, correct counts, element and token counts, one bucket per token, fixed slot types, required depth per slot) and returns a list of problems.

## Attempt lifecycle (src/lib/attempts.ts)

- `getParticipantOverview(db, userId)`: statuses for the three assessments (`not_started` when no in_progress or submitted attempt exists), `allSubmitted`, and the plan when all three are submitted. Calls `finaliseExpired` first.
- `startAttempt(db, user, assessmentId)`: refuses unless status is not_started; attemptNumber = 1 + count of void attempts for that user and assessment; loads the frozen bankVersion from settings (`bank_version`); generates the paper; stores served ids, presentation, `startedAt = now`, `endAt = now + 10 min`; audits `attempt.started`.
- `getAttempt(db, user, attemptId)`: finalises if expired, then returns served items (in served order), answers, `endAt`, `serverNow`, status.
- `saveAnswer(db, user, attemptId, itemId, answer)`: validates the answer shape against the served item; rejects (409) when not in_progress or when `now >= endAt` (and finalises); merges into `answers`; sets `lastSavedAt`; participants' `lastActivityAt` updated.
- `submitAttempt(db, user, attemptId, kind)`: idempotent; scores; stores section scores, prescriptions, shorthand, timeUsedSeconds (min(now, endAt) - startedAt); audits `attempt.submitted` or `attempt.auto_submitted`.
- `finaliseExpired(db, userId?)`: every in_progress attempt with `endAt <= now` is submitted with kind `expired`.
- `resetAttempt(db, admin, userId, assessmentId, reason)`: any attempt in in_progress or submitted becomes `void` with `voidedAt`, `voidedBy`, `voidReason`, `statusBeforeVoid`; the full record stays; audits `attempt.reset`.
- Training Plan is derived from the three submitted attempts' prescriptions (each assessment contributes its sections; modules are decided per docs/03).

## Time

Store UTC. Display with `Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", ... })` via `src/lib/time.ts` (`formatMelbourne(date)` gives `9 Sep 2026, 21:40`).

## UI conventions

- Tailwind classes only, tokens from `src/app/globals.css` (`brand-500`, `ink-900`, `tint-200`, `surface`, `success`, `attention`, `danger`, `rounded-card`, `shadow-card`).
- Buttons: primary `bg-brand-500 text-white hover:bg-brand-600`; secondary `border border-brand-300 text-ink-900 bg-white hover:bg-tint-200`; danger `bg-danger text-white`.
- Cards: `rounded-card border border-brand-500/20 bg-white shadow-card`.
- Status pills: Not started (neutral), In progress (brand tint), Submitted (success outline).
- Every interactive element keyboard operable with visible focus. Icons are inline SVG paths, never emoji.
- Saved indicator states: "Saved", "Saving", "Not saved, retrying" (calm, factual).

## Testing

- Unit: `tests/unit/**`. Integration: `tests/integration/**` using `createMemoryDb()` from `src/db/client.ts`. E2E: `tests/e2e/**` (Playwright, served by `npm run e2e:server`).
- Every engine rule in docs/03 has a named test. Every lifecycle edge case in docs/02 has a named integration test.
