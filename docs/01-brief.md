# 01 Brief - Purpose and Context

## Purpose

Avec Global is running a test automation capability uplift programme for its managed service testing team deployed at a financial sector client. The client is deliberately unnamed throughout this project and must never appear in the application, code or data. The programme prescribes self-paced training courses per person, and the starting point of each person's journey must be determined objectively. Self-assessment was rejected because the stakeholder environment is data and fact driven and self-assessment is subjective. This application is the replacement: a short, structured, deterministic placement assessment whose output is each participant's bespoke training plan.

Each journey is individual at module level, not persona level. A tester can be strong in SQL, new to Python and experienced in testing but not test automation, and the plan must reflect exactly that combination.

## Privacy by anonymisation

The system stores no personally identifiable information of any kind. No names, no email addresses, nothing personal. Participants exist in the system only as numbered codes (Participant 1, login participant-01). The administrator allocates codes to real people offline, in a register that never enters the system. This is the security model: with nothing personal to protect, free-tier hosting is a defensible choice rather than a compromise, and the protections that cost nothing (HTTPS, hashed passwords, secure sessions, basic rate limiting) are kept regardless.

## Users

- About 15 participants, all experienced professional software testers. The skill being assessed is test automation prerequisite capability only, never testing ability in general. Tone and copy respect that they are skilled professionals.
- One or two administrators from Avec delivery management, who also hold the offline allocation register.

## Shape of the solution

Three separate short assessments, each taken once by every participant, in any order:

1. Test Automation Fundamentals - 10 questions, 10 minutes.
2. SQL - 10 questions, 10 minutes.
3. Python - 10 questions, 10 minutes.

Item types: single answer (radio), multiple answer (checkboxes labelled "Select all that apply."), ordering (drag elements into sequence) and matching (drag tokens onto categories). The two drag and drop types are confined to designated slots per docs/03 and always carry a full keyboard alternative. Each participant receives a varied but deterministic paper drawn from a calibrated bank, so no two participants see an identical paper yet every result is reproducible from its stored seed.

## The curriculum the assessment routes into

The programme's modules and selected courses are fixed. The assessment decides, per person, which modules are Prescribed, Credited, or flagged for Evidence review. Blueprints in docs/04 must anchor to what these courses actually teach, because testing out of a module means already knowing what that module's course would have taught. You may fetch the linked course pages to align blueprint topics with the published syllabi. Do not invent coverage.

| Module | Hours | Selected course | Link |
|---|---|---|---|
| TA-1 Test automation foundations | 8 | ISTQB Certified Test Automation Engineer CTAL-TAE V2 (Udemy) | https://www.udemy.com/course/istqb-certified-tester-test-automation-engineer-ct-ctal-tae-v2/ |
| SQL-1 SQL foundations | 7 | Intermediate SQL then Joining Data in SQL (DataCamp) | https://www.datacamp.com/courses/intermediate-sql and https://www.datacamp.com/courses/joining-data-in-sql |
| SQL-2 SQL for testing | 2 | SQL for Testers (LinkedIn Learning) | https://www.linkedin.com/learning/sql-for-testers |
| PY-1 Python foundations | 20 | Programming for Everybody (Coursera) | https://www.coursera.org/learn/python |
| PY-2a pytest core | 9 | Python Automation Testing With Pytest (Udemy) | https://www.udemy.com/course/python-automation-pytest/ |
| PY-2b Testing data with Python | 4 | Introduction to Testing in Python (DataCamp) | https://www.datacamp.com/courses/introduction-to-testing-in-python |
| GIT-1 Git essentials | 3 | Confirmed separately | Not assessed by this tool |

## Outputs

- Participant output: their bespoke training plan. Sequenced modules with hours and direct course links, provisional markers where evidence review applies, and a print-friendly layout. Participants never see scores, section results or per-question feedback. The plan is the product.
- Administrator output: everything. Per-participant scores by section, outcomes and prescriptions, cohort reports and statistics, module demand totals, per-question item analysis, a full audit trail and clean exports.

## Deliverables

The finished work is the deployed application plus four verified guides: a Participant Guide, an Administrator Guide, a Hosting Guide and an Operations Guide, per docs/06.

## Success criteria

- A participant completes all three assessments in under 40 minutes total on an interface that never loses an answer, and finishes with a clear, printable training plan.
- Results are deterministic, reproducible from the stored seed, and exportable in one CSV that delivery management can use without rework.
- No question generates a legitimate dispute. Every item has one defensible key, a written rationale and a source anchor.
- The administrator can create participants in bulk without entering any personal data, monitor live, reset a broken attempt in under a minute, read cohort statistics at a glance and close the exercise with a full export.
- No PII exists anywhere, verified by inspecting the database schema and every export.
- Every admin action that changes state is recorded in an audit log.
- The four guides are accurate against the built application, and the Hosting Guide is proven by a clean second deployment performed by following only its steps.
- Unmistakably Avec branded to the standard of https://www.avecglobal.com.
- The quality bar in one line: verified by automated tests, auditable end to end, dependable through dropped connections and refreshes, and intuitive on first use without training.

## Decided by the owner - implement as stated

- No PII in the system, participant codes only, allocation register offline.
- Participants receive their training plan only, never scores.
- Hosting free or near-free per docs/06.
- Ordering and matching item types included, confined to designated slots.

## Defaults held for confirmation - CONFIRM at kickoff

- Application name "Avec Capability Placement", displayed with the brand title device as "Avec / Capability Placement".
- All thresholds in docs/03.
- The designated drag and drop slots (TA slots 2 and 9).
- The primary hosting path chosen from the two in docs/06.
