# 07 Prompts for Claude Code

Paste these in order. Do not skip the stop points.

## Prompt 1 - Kickoff

Read CLAUDE.md and every file in docs/ in full. Fetch https://www.avecglobal.com and its published stylesheet and derive the brand tokens per docs/05. Then give me exactly four things and stop: your implementation plan phase by phase against docs/06, your stack and hosting confirmation with any substitutions justified in one line each, the brand token sheet for approval, and a numbered list of open questions including every item marked CONFIRM in the docs with your recommended default. Do not write any code yet.

## Prompt 2 - After plan approval

Approved with the answers above. Execute Phase 0 and Phase 1 per docs/06. Deploy as you go. Finish by showing me the deployed URL, the admin bootstrap working, a bulk creation of 15 anonymous participants with the Allocation Register CSV, one participant logging in, and proof the schema contains no personal data fields, with the phase acceptance criteria checked off one by one.

## Prompt 3 - Engine

Execute Phase 2. The engine rules in docs/03 are exact, implement them literally, including the ordering and matching types and the never-serve-the-key rule. Show me the unit test output proving seed determinism, all four scoring rules, every prescription mapping row and expiry submission, then the integration test output for the attempt lifecycle including reset, resume and autosaved partial arrangements.

## Prompt 4 - Participant experience

Execute Phase 3 to the full quality bar in docs/05, including both drag and drop interactions with their keyboard alternatives, the verbatim instructions copy, and the Training Plan with its print view. Then walk me through screenshots of every participant screen in order, including an ordering item and a matching item mid-interaction, the same two items operated by keyboard only, the timer amber state, the review screen with a mix of answered and unanswered, the Training Plan on screen and its printed A4 output, and a side-by-side brand fidelity comparison against https://www.avecglobal.com.

## Prompt 5 - Admin reporting and operations

Execute Phase 4. Then demonstrate on the deployed app with seeded sample data: the overview dashboard, the results table expanded for one participant, the cohort statistics, the module demand summary, the item analysis with an outlier flagged, the audit log showing the actions you just performed, a reset with a typed reason, a retire refused by the slot-depth guard, and the close and export files opened with their contents shown. Confirm every export contains participant codes only.

## Prompt 6 - Question bank

Execute Phase 5 step 1 and 2 only: generate the complete bank per docs/04, verifying blueprint alignment against the linked course syllabi where fetchable, then produce the human-readable review document with every item, key, rationale, anchor and rule self-check, including the ordering and matching items with their sequences and assignments spelled out. Stop there. Do not load the bank.

## Prompt 7 - After bank sign-off

The bank is signed off with the amendments noted above. Apply them, load, freeze bankVersion, and run the pilot end to end with two internal test accounts, operating the drag and drop items once by mouse and once by keyboard. Show me the pilot Training Plans and then reset the pilot attempts away.

## Prompt 8 - Hardening and verification

Execute Phase 6. Show me the full test suite green, the accessibility pass notes, the cross-browser pass notes, the 20-concurrent sanity result, and the no-PII verification of the schema and every export. Fix everything found and re-run until clean.

## Prompt 9 - Documentation

Execute Phase 7. Produce the four guides in /guides per docs/06, each verified line by line against the built application. Then prove the Hosting Guide by performing a clean second deployment following only its written steps, show me it working, and tear it down. Give me all four guides for review.

## Prompt 10 - Go-live

Execute Phase 8. Perform the go-live checklist in docs/06 for real on production and evidence each line. Finish with the final deployed URL and a ten-line-or-fewer summary for the administrator of what to do next.
