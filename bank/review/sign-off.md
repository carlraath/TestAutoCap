# Question bank sign-off record

Bank version 1. 65 items. This is the record docs/04 step 3 asks for: what was reviewed, how, what changed, and what a human reviewer should still look at before the bank is used with real participants.

## What the owner is being asked to ratify

The owner delegated the stop points for this build (see DECISIONS.md entry 11), so the sign-off below was performed by independent adversarial review rather than by the owner and a nominated subject matter expert. The bank is loadable and every item passes the machine validator and the charter self-checks. **A human reader should still spend an hour on `bank-review.md` before real participants are created.** Nothing in the process replaces a subject matter expert reading the questions.

## Method

Each item was reviewed by three independent reviewers, each given a different lens and each instructed to refute rather than to approve:

| Lens | What it tried to break |
|---|---|
| Key defensibility | Work the answer out independently from the stem alone, executing the SQL or running the Python, and argue every alternative as strongly as a real candidate could. Fail the item if any alternative is defensible, if the key is wrong, or if the stem lacks information needed to reach it. |
| Charter compliance | Every rule in the docs/04 unambiguity charter and every structural rule, checked mechanically: option and element counts, banned constructs, distractor quality, UK English, one visual element, rationale coverage, source anchor, no organisation or person names. |
| Calibration and alignment | Read the item against its slot siblings and the anchored course syllabus. Fail it if it drifts off the blueprint topic, is markedly easier or harder than its siblings, or duplicates a sibling with cosmetic changes. |

A reviewer that failed an item returned each problem as a precise sentence quoting the offending text. Failing items went back to a revising author with those problems and were then re-reviewed.

## Coverage

| Measure | Count |
|---|---|
| Items authored | 65 |
| Items given a full three-lens review | 65 |
| Review verdicts recorded | 303 |
| Items revised in response to findings | 54 |
| Slots given a final resolve-and-verify pass | 28 |
| Items rewritten or amended in that final pass | 53 |

The review ran in two interrupted sessions. After the interruptions, every item that still carried an unresolved finding, and every item that had been revised without being re-reviewed, was taken through a final pass organised by slot: one reviewer per slot, holding all of that slot's items at once, resolving the outstanding findings, re-verifying every key by execution where the item shows code or data, and judging the slot's items against each other for calibration. Reviewing by slot rather than by item was deliberate: the most common finding in the first pass was that sibling items were near-duplicates of one another, which can only be judged by holding the siblings side by side.

## What the review changed

The findings clustered into five recurring problems, all of which were addressed:

1. **Near-duplicate siblings.** Many slots had two items built on one template with cosmetic substitutions, so the two papers a participant might see were not genuinely different. The weaker sibling was rewritten onto a different scenario.
2. **Two visual elements.** Most SQL items showed both a data table and a fenced query block, against the charter's one-visual-element rule. These were reshaped to the form the docs/04 exemplars use: the data as the single visual element, the query written inline in the stem.
3. **Cueing.** Keys that were the longest option, or that echoed the stem's own wording, let a test-wise candidate score without the knowledge. These were rebalanced.
4. **Weak distractors.** Options that no genuinely unsure professional would choose reduce an item to fewer live options than its sibling. These were replaced with plausible misconceptions.
5. **Person names in data.** Some SQL tables used first names as values. These were replaced with ids, regions and reference codes.

## Verification

- Every SQL key was confirmed by executing the query against the shown tables in PGlite, an embedded PostgreSQL.
- Every Python key was confirmed by running the snippet.
- Concept items carry a rationale that argues each alternative down; those arguments are in `bank-review.md`.
- `npx tsx scripts/assemble-bank.ts` rebuilds `bank/bank.v1.json` from the per-item drafts and runs the structural validator. It reports no problems.
- `npx tsx scripts/bank-review-doc.ts` regenerates `bank-review.md` from the assembled bank, so the review document always describes exactly what loads.

## The one-visual-element rule as applied

docs/04 allows one visual element per item, and its SQL exemplars show the shape that resolves the tension for a question that must show data and a query: the data is the visual element and the query is written inline in the stem. Every SQL item now follows that shape.

Four SQL slots ask the candidate to compare two sets of data (slot 2 joins, slot 7 set operations for reconciliation, slot 8 records missing from a target, slot 9 changed values between source and target). These cannot be posed with one table. docs/04 grants the two-small-tables shape explicitly for slots 2 and 8; it has been read as applying to slots 7 and 9 as well, since they are the same source-against-target comparison. Those items show two small tables and the query inline, and nothing else. A machine check across the assembled bank confirms no item exceeds this: no item carries both a table and a fenced block, and only the three slot 7 items sit at two tables alongside slots 2, 8 and 9.

Also confirmed mechanically across all 65 items: no emojis, no "Select all that apply." inside any stem, no person names in any data value, and every multiple-answer item at five or six options with two or three correct.

## Known points for the owner

1. **Bank size.** The per-slot rule in docs/04 (two items per slot, three for the contested slots SQL 2, 7 and 8 and Python 6 and 7) yields 65 items. docs/04 also states a total of 66. The per-slot rule has been followed. Adding a 66th item is a small change if the owner names the slot it belongs to.
2. **Reporting shorthand P4 is unreachable.** docs/03 defines P4 as TA-1, PY-2a and PY-2b all at Evidence review, but any state satisfying that also credits PY-1, which docs/03 evaluates as P3 first. Module-level output is authoritative and is unaffected. The owner may want to reorder the shorthand rules or drop P4.
3. **Human review still recommended.** See the opening paragraph.

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Owner | | | |
| Subject matter expert | | | |

Adversarial review completed 2026-09-10. Bank frozen at version 1 on loading; after go-live the only live lever is retiring an item, per docs/02.
