# 03 Assessment Engine

## Definitions

- Assessment: one of ta, sql, python.
- Section: a scored group within an assessment.
- Slot: a fixed topic position within a section. Every participant answers one item per slot, so all papers cover identical ground.
- Item: a question in the bank belonging to exactly one slot.
- Paper: the ordered set of items served to one participant for one attempt.
- Bank version: an integer frozen at go-live. Every attempt records the bank version it was served from.

## Structure

| Assessment | Sections and slots | Served | Duration |
|---|---|---|---|
| Test Automation Fundamentals | fundamentals: slots 1 to 10 | 10 | 10 min |
| SQL | foundations: slots 1 to 6. applied: slots 7 to 10 | 10 | 10 min |
| Python | core: slots 1 to 6. testing: slots 7 to 10 | 10 | 10 min |

Bank depth: at least 2 calibrated items per slot, and 3 for the slots docs/04 marks as contested. All items in a slot are interchangeable in topic and difficulty.

## Item types

| Type | Interaction | Answer |
|---|---|---|
| single | Radio buttons, exactly 4 options | One option id |
| multi | Checkboxes, 5 or 6 options, labelled "Select all that apply." | A set of option ids |
| ordering | Drag elements into sequence, 3 to 5 elements, full keyboard alternative | An ordered list of element ids |
| matching | Drag tokens onto labelled buckets, 3 or 4 buckets, 4 to 6 tokens, full keyboard alternative | A complete token-to-bucket assignment |

The item type is fixed per slot: every item in a slot shares one type, so all papers are structurally identical. Designated drag and drop slots (CONFIRM): TA slot 2 is ordering and TA slot 9 is matching. All other slots are single or multi per the blueprints in docs/04. This caps drag and drop at two items per paper by construction.

## Deterministic variation

- Seed = SHA-256(userId + ":" + assessmentId + ":" + attemptNumber + ":" + bankVersion).
- The seed drives, through a seeded PRNG: the item drawn per slot, the shuffled presentation order of the paper, the shuffled option order within single and multi items (skipped where fixedOrder is set), the initial arrangement of ordering elements, and the tray order of matching tokens.
- The initial arrangement of an ordering item must never equal the key. If the shuffle lands on the key, the engine deterministically applies the next permutation.
- Identical inputs always reproduce the identical paper. Different participants get different papers. A reset increments attemptNumber so a retake paper differs from the voided one.
- Store on the attempt: seed inputs, served item ids in served order, option orders, initial arrangements and tray orders. Every result is fully auditable and every dispute answerable from the record.

## Scoring

- single: 1 point for the key, 0 otherwise.
- multi: 1 point only for selecting exactly the key set, 0 otherwise.
- ordering: 1 point only for the exact key sequence, 0 otherwise.
- matching: 1 point only for the exact complete assignment of every token, 0 otherwise.
- Unanswered scores 0. No partial credit anywhere. Partial credit schemes are where disputes live, so they are excluded by design.
- Section score = sum of its items. Nothing is weighted.

## Thresholds - DEFAULTS, CONFIRM with owner

| Section | Served | Threshold to meet |
|---|---|---|
| TA fundamentals | 10 | 8 |
| SQL foundations | 6 | 5 |
| SQL applied | 4 | 3 |
| Python core | 6 | 5 |
| Python testing | 4 | 3 |

## Prescription mapping

Three outcome states per module. Prescribed: the participant completes the module. Credited: the module is credited outright. Evidence review: provisionally credited pending a reviewer confirming real work evidence (authored scripts, maintained suites). Evidence review exists because practical automation capability is never credited on a quiz alone.

| Module | Rule |
|---|---|
| SQL-1 | Credited if SQL foundations met, else Prescribed. |
| SQL-2 | Credited if SQL foundations met AND SQL applied met, else Prescribed. |
| PY-1 | Credited if Python core met, else Prescribed. |
| PY-2a | Evidence review if Python core met AND Python testing met, else Prescribed. |
| PY-2b | Same rule and outcome as PY-2a. |
| TA-1 | Evidence review if TA fundamentals met, else Prescribed. |
| GIT-1 | Not assessed. Always shown as "Confirmed at journey map issue". |

Reporting shorthand, derived only, never shown to participants: P1 if PY-1 and SQL-1 both Prescribed. P2 if SQL-1 Credited and PY-1 Prescribed. P3 if PY-1 Credited. P4 if TA-1, PY-2a and PY-2b are all Evidence review. Module-level output is always authoritative.

The Training Plan totals the hours of Prescribed modules using the hours in docs/01.

## Integrity posture

Papers vary, time is short, and the audience is a professional team on trust. No proctoring, no copy-blocking, no surveillance. The deterrent is design, not policing.
