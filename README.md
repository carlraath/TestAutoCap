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
