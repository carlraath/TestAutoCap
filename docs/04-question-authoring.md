# 04 Question Authoring

## Governing principle

Testing out of a module means already knowing what that module's course teaches. Every item therefore anchors to a topic the selected course covers, at the level a course graduate would hold. Assess prerequisite capability for this programme's back-end, data-focused automation use case. Nothing generic, nothing outside the blueprints, nothing about the programme's own internal documents.

## Blueprints

One line per slot: topic, item type, and the cognitive style of the item.

### Test Automation Fundamentals (gates TA-1)
1. Purpose of automation vs manual testing - single - concept selection.
2. Test automation pyramid - ordering - arrange the layers into the canonical sequence.
3. Agile testing quadrants - single - place an activity.
4. Regression vs progression testing - single - classify a scenario.
5. Automation candidacy factors - multi - select the strengthening factors.
6. What not to automate - single - pick the weakest candidate from scenarios.
7. Maintenance cost of automation - single - concept.
8. Evidence on failure - multi - what a useful failure record contains.
9. Run triggers - matching - place scenarios onto the trigger that fits (on commit, scheduled, pre-release, on demand).
10. Flaky tests - single - recognise the concept and the correct response.

### SQL (foundations gates SQL-1, applied gates SQL-2)
1. SELECT and WHERE against a shown table - single - predict the result.
2. INNER vs LEFT JOIN - single - predict row counts from two small tables. Contested slot, 3 items.
3. Aggregation with GROUP BY and HAVING - single - predict the result.
4. Subquery reading - single - what does this return.
5. NULL behaviour in filters and comparisons - single - predict the result.
6. DISTINCT and ORDER BY - single - predict the result.
7. Set operations for reconciliation (EXCEPT, INTERSECT, UNION) - single - choose the query for a comparison goal. Contested slot, 3 items.
8. Find records missing from a target - single - choose the query, tables shown. Contested slot, 3 items.
9. Detect changed values between source and target - single - choose the approach.
10. Test data hygiene in SQL - multi - inserting and cleaning deterministic test rows.

### Python (core gates PY-1, testing gates PY-2a and PY-2b)
1. Types and truthiness - single - predict the output.
2. Control flow with a loop and condition - single - predict the output.
3. Functions, arguments, return values - single - predict the output.
4. Lists and dicts - single - predict the output or pick the correct access.
5. String operations - single - predict the output.
6. Reading a short realistic snippet end to end - single - predict the output. Contested slot, 3 items.
7. pytest discovery and naming conventions - multi - select what gets collected. Contested slot, 3 items.
8. assert semantics and failure meaning - single - interpret a failing test.
9. Fixtures and parameterisation - single - purpose selection.
10. Comparing two datasets in Python - multi - what a comparison must handle (order, missing rows, tolerance).

## Item rules - the unambiguity charter

- Exactly one defensible key for single items, exactly one defensible key set for multi, exactly one defensible sequence for ordering, exactly one defensible assignment for matching. If a competent professional could argue an alternative, rewrite or discard.
- Prefer "read this and predict the result" over recall. Show the code or table, ask what happens. Facts on the page, not memory of trivia.
- Banned outright: negative stems ("which is NOT"), "all of the above", "none of the above", opinion stems ("best practice is"), version-specific trivia, tool trivia beyond pytest basics, trick wording, double negatives, humour.
- single items have exactly 4 options. multi items have 5 or 6 options with 2 or 3 correct and carry the visible label "Select all that apply."
- ordering items have 3 to 5 elements with a single canonical sequence stated in the stem's own terms (for example "from most numerous to fewest"), so the ordering criterion is explicit, never implied.
- matching items have 3 or 4 buckets and 4 to 6 tokens. Every token belongs to exactly one bucket beyond argument. If a token could defensibly sit in two buckets, rewrite or discard.
- Distractors must be plausible wrong answers a genuinely unsure person might pick, never absurd filler and never near-synonyms of the key.
- Options are order-independent unless the item is flagged fixedOrder (for example numeric options presented ascending). Ordering and matching initial presentation is engine-shuffled per docs/03.
- UK English. Plain sentences. Code in fenced blocks, tables at most 5 rows, one visual element per item at most.
- Every item carries a rationale (why the key is right and each alternative wrong) and a sourceAnchor naming the course topic it maps to. Never shown to participants. They are the dispute-handling record.
- Difficulty calibration: items within a slot must be interchangeable. Write them together, compare them directly, and equalise.

## Exemplars - the calibration bar

**SQL slot 2, single.** Tables shown: customers(id: 1, 2, 3) and orders(customer_id: 1, 1, 3, 4). "How many rows does SELECT * FROM customers INNER JOIN orders ON customers.id = orders.customer_id return?" Options: 2, 3, 4, 5. Key: 3. Rationale: rows for customer 1 twice and customer 3 once, order 4 has no match, customer 2 has no orders.

**SQL slot 8, single.** Tables shown: source(id: 101, 102, 103, 104) and target(id: 101, 103). "Which query returns the ids present in source but absent from target?" Options: SELECT id FROM source EXCEPT SELECT id FROM target. SELECT id FROM source INTERSECT SELECT id FROM target. SELECT id FROM source UNION SELECT id FROM target. SELECT id FROM target EXCEPT SELECT id FROM source. Key: the first. Rationale: EXCEPT returns left minus right, the reconciliation primitive, the reversed form finds the opposite gap.

**Python slot 2, single.** Code shown: values = [3, 1, 4, 1] then a loop adding each v greater than 1 to total, then print(total). Options: 7, 8, 9, 4. Key: 7.

**Python slot 7, multi.** "pytest runs in a folder containing the file test_orders.py. Select all the functions pytest will collect as tests." Options: def test_totals(), def check_totals(), def test_empty_input(), def totals_test(), def setup_data(). Key: test_totals and test_empty_input. Rationale: collection requires the test_ prefix on the function name.

**TA slot 2, ordering.** "Arrange the automated test layers of the test automation pyramid from most numerous at the top of this list to fewest." Elements: Unit tests, API tests, UI tests. Key sequence: Unit tests, API tests, UI tests. Rationale: the pyramid widens toward fast isolated tests, so unit tests are the most numerous and UI tests the fewest. A second calibrated item for this slot orders the same layers by execution speed, fastest first, with the same canonical answer available beyond argument.

**TA slot 9, matching.** "Place each scenario onto the run trigger that fits it." Buckets: On commit, Scheduled, Pre-release, On demand. Tokens: A fast unit suite guarding every merge. A nightly full regression across environments. A full smoke run immediately before a production deployment. A rerun to verify one specific defect fix. Key: in bucket order as listed. Rationale: each scenario names its trigger's defining property, and no token fits two buckets.

**TA slot 5, multi.** "Select all the factors that strengthen a regression test's case for automation." Options: It runs every release. The functionality it covers is stable. Its result needs human visual judgement each run. Its requirements change frequently. Its expected outcome is deterministic. Key: first, second and fifth. Rationale: repeatability, stability and deterministic outcomes are the candidacy factors, the other two actively weaken the case.

## Data format

Bank is one JSON file, loaded by a seed script, with bankVersion at the top. Keys exist server-side only and are never sent to the client.

{
  "bankVersion": 1,
  "items": [
    {
      "id": "sql-08-a",
      "assessment": "sql",
      "section": "applied",
      "slot": 8,
      "type": "single",
      "stem": "markdown with fenced code and pipe tables permitted",
      "options": [{ "id": "a", "text": "...", "correct": true }],
      "fixedOrder": false,
      "difficulty": "standard",
      "rationale": "...",
      "sourceAnchor": "Joining Data in SQL - set operations"
    },
    {
      "id": "ta-02-a",
      "assessment": "ta",
      "section": "fundamentals",
      "slot": 2,
      "type": "ordering",
      "stem": "...",
      "elements": [{ "id": "e1", "text": "Unit tests" }],
      "key": ["e1", "e2", "e3"],
      "difficulty": "standard",
      "rationale": "...",
      "sourceAnchor": "..."
    },
    {
      "id": "ta-09-a",
      "assessment": "ta",
      "section": "fundamentals",
      "slot": 9,
      "type": "matching",
      "stem": "...",
      "buckets": [{ "id": "b1", "label": "On commit" }],
      "tokens": [{ "id": "t1", "text": "...", "bucket": "b1" }],
      "difficulty": "standard",
      "rationale": "...",
      "sourceAnchor": "..."
    }
  ]
}

## Generation and review workflow

1. Generate the full bank per blueprint: 2 items per slot, 3 for contested slots, 66 items total. Verify topic alignment against the linked course pages first where fetchable.
2. Produce a human-readable review document: every item with its options or elements or buckets, key, rationale and anchor, grouped by slot, plus a self-check declaring each item passes every rule in the charter.
3. Hard stop. The owner and a nominated SME review and sign off. Amend and regenerate the review document until signed off.
4. Load the approved bank, freeze bankVersion, and run a pilot with two internal test accounts end to end, including both drag and drop items operated by mouse and again by keyboard.
5. After go-live the bank is frozen. The only live lever is retiring an item per docs/02.
