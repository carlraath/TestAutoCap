# 06 Build Plan

## Stack and hosting

Recommended: Next.js (current stable, App Router) with TypeScript strict, Tailwind, Postgres on a managed free tier (for example Neon), a light query layer (Drizzle or plain SQL), session cookies via a maintained session library, deployed on Vercel free tier. Fallback: a single Node service with SQLite on a host with a persistent volume and a free or lowest-cost plan (Railway or Render) behind HTTPS. Confirm the current best free-tier combination in your plan and pick one primary path, substitute equivalents only with one-line justification.

Hosting cost target: zero on free tiers, with an absolute ceiling of a few dollars for the live fortnight. The Hosting Guide states any actual cost encountered. Hard requirements regardless of stack: persistent server-side storage, HTTPS by default, server-authoritative time, environment-variable secrets, one-command seed, and a teardown that verifiably deletes all data.

## Phases

Each phase ends with its acceptance criteria demonstrably met, tests green and a deploy.

**Phase 0 - Plan and scaffold.** Implementation plan, stack confirmation, open questions, and the brand token sheet derived from https://www.avecglobal.com per docs/05. STOP for approval. Then scaffold with the approved brand tokens and local logo and gradient assets, scripted checks (typecheck, lint, test), deploy a branded hello page over HTTPS.

**Phase 1 - Auth and participant management.** Admin bootstrap from env. Login, sessions, rate limiting. Bulk participant creation with the one-time Allocation Register CSV. Participant list with statuses. Password regeneration. Audit log foundations. Acceptance: admin creates 15 anonymous participants and one of them logs in on the deployed URL, and the database schema visibly contains no personal data fields.

**Phase 2 - Engine and attempt lifecycle.** Data model, bank loading with a development sample bank covering all four item types, seeded paper generation including initial arrangements, autosave including partial arrangements, server-authoritative timer with expiry finalisation, one-attempt enforcement, resume, reset with archive. Acceptance: unit tests prove seed determinism, all four scoring rules, the never-serve-the-key rule for ordering, every prescription mapping row, and expiry submission. Integration tests prove the lifecycle including reset and resume.

**Phase 3 - Participant experience.** All participant screens per docs/05 at full polish, including both drag and drop interactions with their keyboard alternatives, review, confirmations and the Training Plan with its print view. Acceptance: complete a full three-assessment run on the deployed app without a single rough edge, operate an ordering and a matching item entirely by keyboard, refresh mid-attempt and lose nothing, print the Training Plan to a clean branded A4 page, and confirm brand fidelity side by side with https://www.avecglobal.com.

**Phase 4 - Admin reporting and operations.** Overview dashboard, results with expandable detail, cohort statistics, module demand summary, item analysis with outlier flags, audit log view, retire item with slot-depth guard, close and export producing all four export files. Acceptance: every report renders correctly against seeded sample data, and each export opens cleanly and contains everything docs/02 lists with participant codes only.

**Phase 5 - Question bank.** Generate per docs/04, produce the review document. STOP for sign-off. Load the approved bank, freeze bankVersion, pilot end to end with two internal accounts including drag and drop by mouse and by keyboard.

**Phase 6 - Hardening and verification.** Full automated test pass, error states, load sanity at 20 concurrent, an accessibility pass (keyboard-only full run, focus visibility, AA contrast), a cross-browser pass (current Chrome, Edge and Safari), and a no-PII verification inspecting the schema and every export. Fix everything found and re-run until clean.

**Phase 7 - Documentation.** Produce the four guides in /guides as polished markdown, each verified line by line against the built application:

- Participant Guide: one to two pages. What this is, how to log in with your participant code, the rules, how each question type works including the keyboard alternatives, what your Training Plan means, who to contact if something goes wrong.
- Administrator Guide: every admin function step by step, from bulk creation and the Allocation Register through monitoring, reports, resets, retiring an item, password regeneration and close and export.
- Hosting Guide: from a clean machine to live. Accounts needed, exact commands, environment variables, seeding, verification steps, the custom URL option, actual costs, and full teardown with data deletion.
- Operations Guide: the live-week runbook. Daily monitoring, the reset procedure, handling a suspected bad item, the close and export procedure, a troubleshooting table, and teardown with a written deletion confirmation to the owner.

Acceptance: the Hosting Guide is proven by performing a clean second deployment following only its written steps, then tearing that deployment down.

**Phase 8 - Go-live.** Execute the go-live checklist below on production and evidence each line.

## Testing expectations

- Unit: engine functions exhaustively, including all four item-type scoring rules, arrangement seeding, and every mapping row in docs/03.
- Integration: attempt lifecycle, expiry, reset, resume, idempotent submit, autosave of partial arrangements.
- End to end (Playwright): one participant happy path covering all four item types, one keyboard-only pass over the drag and drop items, one admin happy path from creation to export.
- Manual checklist: instructions copy accuracy, timer visuals, print output, report correctness against known sample data, export contents.

## Go-live checklist

- Bank signed off, loaded, frozen, pilot completed and pilot attempts reset away.
- Admin password rotated from bootstrap value. Real participants created, Allocation Register downloaded once, completed offline and never uploaded.
- HTTPS verified, cookies secure, rate limiting live, no-PII verification re-run on production.
- A practice reset and a practice close and export performed on production and verified, then cleared.
- Timezone display verified against Melbourne time.
- All four guides delivered and current.

## Runbook for the live week

- Create any late participants via bulk creation and extend the offline register.
- Monitor the overview daily. Chase Not started participants through delivery management offline, since the system holds no contact details by design.
- On a reported technical failure: verify status, reset with reason, tell the participant through delivery management to go again.
- On a suspected bad item: check its item analysis, retire if warranted, note it for the record. Past attempts stand unless the owner decides otherwise offline.
- At close: close and export, hand all export files to the owner, confirm receipt, then tear down the deployment and delete the database. Confirm deletion to the owner in writing.
