# 02 Functional Specification

## Roles

- Participant: logs in with a participant code, takes each of the three assessments exactly once, receives their bespoke training plan.
- Administrator: manages participants, monitors and reports, resets attempts, retires questions, exports, closes the exercise.

## Identity and privacy

- Participants are created as numbered codes only: display name "Participant 1", login "participant-01". No name field, no email field, no personal data anywhere in the schema.
- Passwords are system-generated, strong and memorable (three random words plus digits, 14 characters or more), because usernames are enumerable.
- The administrator downloads a one-time Allocation Register CSV at creation: participant code, initial password, and an empty "Allocated to" column. The register is completed offline and the interface states plainly: complete this offline and never upload it anywhere.
- Admin bootstrap from ADMIN_USERNAME and ADMIN_PASSWORD environment variables on first run. The admin account is a role flag, not a special code path.

## Authentication

- Username and password. Passwords hashed with argon2 or bcrypt. Sessions via signed httpOnly secure cookies, 8 hour expiry, sliding.
- Rate limit login attempts (for example 10 per 15 minutes per account and per IP). Generic failure message.
- Admin can regenerate any participant's password at any time. Shown once, never stored or displayed in plain text afterwards.

## Administrator functions

- Bulk participant creation: choose a count, the system creates participant-01 through participant-NN with generated passwords and returns the one-time Allocation Register CSV.
- Participant list with per-assessment status (Not started, In progress, Submitted), reset counts and last activity.
- Reset attempt: confirmation dialog, mandatory reason, archives the voided attempt in full for audit, returns that assessment to Not started.
- Retire question: removes an item from future papers only. Blocked if any slot would fall below the serve count. Recomputation of past attempts is out of scope.
- Regenerate password, per participant.
- Close and export, per Reporting below.
- Audit log: every state-changing admin action is recorded with action, target, reason where given, and timestamp, and is viewable and exportable. Participant attempt events (started, submitted, auto-submitted) appear in the same log.

## Reporting and statistics (administrator)

- Overview dashboard: completion counts per assessment (not started, in progress, submitted), cohort progress at a glance.
- Results table: per participant and assessment, section scores, section outcomes, module prescriptions, time used, seed and bank version. Expandable to full attempt detail including the served paper and answers.
- Cohort statistics: per section, mean, median, range and a score distribution bar. Rendered with inline SVG or CSS, no external chart libraries.
- Module demand summary: for each module, how many participants have it Prescribed and how many at Evidence review, plus total prescribed hours across the cohort. This is the licence-purchasing view.
- Item analysis: per served item, attempts, facility (percentage correct) and answer distribution, with outliers flagged so a misbehaving item is visible during the live week.
- Exports: results CSV (one row per participant per assessment, participant codes only), item analysis CSV, audit log CSV, and a JSON archive of full attempt detail. Close and export produces all four.

## Participant flow

1. Login lands on a dashboard: three assessment cards, each showing status and a Start or Completed state, plus a short welcome line addressed to the participant code.
2. Instructions screen per assessment. Content specified in docs/05. Starting requires an explicit button press with the wording "Start assessment. The timer begins now."
3. Attempt screen: one question at a time, progress indicator, countdown timer always visible, Previous and Next navigation, answers changeable until submission. Ordering and matching items are operated by drag and drop or entirely by keyboard, per docs/05.
4. Review screen listing all questions as answered or unanswered, jump-to links, and Submit with confirmation.
5. On submit or timer expiry: a quiet confirmation for that assessment. When all three are submitted, the Training Plan is generated and becomes the participant's landing view.

## The Training Plan (participant output)

- Shows the participant's modules in recommended sequence: TA-1, SQL-1, SQL-2, PY-1, PY-2a, PY-2b, with Prescribed modules carrying hours and a direct course link, Credited modules marked as credited, Evidence review modules marked "Provisional, confirmed at review", and GIT-1 shown neutrally as "Confirmed at journey map issue".
- A totals line: "Prescribed learning: N hours."
- A closing line: "Your journey map will be issued by delivery management."
- Print-friendly: a print stylesheet renders the plan as a clean branded A4 page.
- No scores, no section results, no per-question feedback, ever.

## Attempt lifecycle

States: not_started, in_progress, submitted, void (archived by reset).

- Start: server creates the attempt, computes the paper from the seed, stores served item ids, presentation order, option orders and initial arrangements for ordering items, sets started_at and end_at = started_at + duration. The timer is server-authoritative.
- Autosave: every answer change persists to the server immediately (debounced within 1 second), including partial ordering arrangements and matching placements. A crash, refresh or dropped connection never loses answers.
- Resume: a participant returning to an in_progress attempt continues with remaining time. If end_at has passed, the server finalises with saved answers on next contact.
- Expiry: at end_at the attempt auto-submits with whatever is saved. Unanswered questions score zero. A sweep or on-request check finalises expired attempts so results never sit open.
- One attempt: starting is impossible unless status is not_started. Submitted assessments always show the completed state.
- Reset: admin only, any state except not_started, archives everything, participant starts fresh with a newly drawn paper (attempt counter feeds the seed so the retake paper differs from the voided one).

## Edge cases

| Case | Behaviour |
|---|---|
| Browser closed mid-attempt | Autosaved answers retained, resume with remaining time. |
| Timer expires while offline | Server finalises with saved answers at next contact or sweep. |
| Double login same account | Latest autosave wins. No lockout, no data loss. |
| Submit pressed twice | Idempotent. Second press returns the confirmation screen. |
| Ordering item never touched | Review screen shows it as unanswered. Scoring compares the final arrangement to the key, and the engine guarantees the initial arrangement is never the key. |
| Matching item partially placed | Review screen shows it as unanswered until every token is placed. Scoring requires the exact complete assignment. |
| Participant disputes an item | Admin views the item, its rationale and anchor in the results detail. Handled offline, no in-app dispute flow. |
| Clock skew on client | Cosmetic only. Server time governs. |

## Non-functional requirements

- Security posture is anonymisation first: there is no personal data to breach. The free protections are kept regardless: HTTPS only, hashed passwords, secure httpOnly cookies, basic rate limiting, no participant data in URLs or logs. Explicitly out of scope: email infrastructure, password self-reset, MFA, SSO, penetration testing.
- Hosting must be free or near-free per docs/06.
- Capacity: 20 concurrent users with instant response. This is small, do not overbuild.
- Desktop-first, cleanly responsive down to tablet. Drag and drop must work with a trackpad and mouse, and its keyboard alternative must work everywhere.
- Timestamps stored UTC, displayed Australia/Melbourne.
- Stability outranks features. Any trade-off resolves toward the participant never losing work and the administrator always being able to recover.
