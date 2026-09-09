# Avec / Capability Placement

A small, Avec-branded web application that runs a one-week anonymous placement assessment (test automation fundamentals, SQL, Python) and produces a deterministic training plan per participant.

- Specification: `docs/` (read `CLAUDE.md` first).
- Guides for people: `guides/` (Participant, Administrator, Hosting, Operations).
- Decisions and approvals: `DECISIONS.md`. Change history: `CHANGELOG.md`.

## Quick start (local, embedded database)

```bash
npm install
cp .env.example .env        # then set SESSION_SECRET and ADMIN_PASSWORD
npm run db:migrate
npm run db:seed             # bootstraps the admin from ADMIN_USERNAME / ADMIN_PASSWORD
npm run db:load-bank        # loads bank/bank.v1.json
npm run cert:dev            # self-signed certificate for https://localhost:3443
npm run build
npm run start:https
```

Checks: `npm run check` (typecheck, lint, unit and integration tests), `npm run test:e2e` (Playwright).

No personal data is stored anywhere. Participants are numbered codes; the allocation register is kept offline by the administrator.

## Status

All eight phases in `docs/06-build-plan.md` are complete. 284 unit and integration tests pass, the
end-to-end suite passes on Chromium, Edge, Firefox and WebKit, the accessibility pass finds no
violations across 20 screens, and 20 concurrent participants autosave and submit without losing an
answer. Evidence for every phase is in `docs/evidence` (start with its README).

The question bank holds 65 items, reviewed adversarially item by item and then slot by slot, with
every SQL and Python key verified by execution. `bank/review/bank-review.md` is the human review
document and `bank/review/sign-off.md` records what was done and what a human reviewer should still
check before real participants are created.

## What the owner still needs to do

1. Read `bank/review/bank-review.md` and countersign `bank/review/sign-off.md`. Nothing replaces a
   subject matter expert reading the questions.
2. Choose a host and follow `guides/hosting-guide.md`. Path A is proven end to end; Path B (Vercel
   and Neon) is written from the vendors' documentation and needs accounts only the owner can create.
3. On the real deployment, rotate the administrator password, create the real participants, and
   download the Allocation Register once. Those three steps depend on real secrets and a real
   participant count, so they were rehearsed here but must be performed again for real.
4. Settle the two points flagged in `DECISIONS.md`: the bank total (65 by the per-slot rule, 66 in
   the docs/04 prose) and the unreachable P4 reporting shorthand.
