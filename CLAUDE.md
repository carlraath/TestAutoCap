# CLAUDE.md - Capability Placement Assessment

## What this project is

A small, polished, unmistakably Avec branded web application that runs a one-week online placement assessment for a professional services testing team starting a test automation training programme. Three short timed assessments (test automation fundamentals, SQL, Python) produce a deterministic bespoke training plan per person. An administrator creates accounts, monitors progress and reporting, resets attempts when something goes wrong and exports results. Roughly 15 participants, known to the system only as numbered participant codes with no personal data of any kind, one attempt each, live for about one week, then exported and torn down.

## Read these before doing anything

- docs/01-brief.md - purpose, context, curriculum the assessment routes into, success criteria, decisions held as defaults.
- docs/02-functional-spec.md - roles, auth, flows, attempt lifecycle, timer, edge cases, non-functional requirements.
- docs/03-assessment-engine.md - structure, seeded selection, scoring, thresholds, prescription mapping, audit records.
- docs/04-question-authoring.md - blueprints, item rules, exemplars, data format, review workflow.
- docs/05-ui-design.md - visual system, screens, components, microcopy.
- docs/06-build-plan.md - stack, phases, acceptance criteria, testing, deployment, runbook.

## Working rules

- Plan first. Your first output is an implementation plan with stack confirmation and open questions. Stop and wait for approval before writing code.
- Build in the phases defined in docs/06-build-plan.md. Each phase ends with its acceptance criteria demonstrably met, tests passing and a deploy.
- Stop points are hard stops: plan approval, question bank review before loading, and the go-live checklist. Do not run through them.
- The assessment engine (selection, scoring, prescription mapping, timer expiry) must have unit tests. No exceptions.
- TypeScript strict mode. Small, boring, dependable code beats clever code. This tool must not fail mid-attempt in front of candidates.
- UK English in all user-facing copy. No emojis anywhere in the UI.
- Branding: the application is unmistakably Avec branded, with tokens, fonts, logo and gradient assets derived from https://www.avecglobal.com per docs/05 and served locally, never hotlinked. Confidentiality: the end client of the wider programme is never named in code, comments, data, copy, commit messages or documentation. If any input appears to name a client, do not propagate it.
- Privacy by anonymisation: the system stores no names, no email addresses and no personal data of any kind. Participants are numbered codes, and the code-to-person allocation lives offline with the owner. If a feature seems to need personal data, redesign it so it does not.
- No analytics, trackers, third-party fonts CDNs at runtime, or external calls from the participant flow. Secrets live in environment variables only.
- Where a decision is marked CONFIRM in the docs, implement the stated default and surface it in your plan for the owner to confirm. Do not invent alternatives silently.
- Commit per phase with clear messages. Keep a running CHANGELOG.md.

## Definition of done

All phases complete, all tests green, deployed over HTTPS, seeded admin working, go-live checklist in docs/06 executed and evidenced, the runbook verified by actually performing a participant creation, a reset and an export on the deployed app, the four guides in /guides verified line by line against the built application, and the Hosting Guide proven by performing a clean second deployment following only its written steps.
