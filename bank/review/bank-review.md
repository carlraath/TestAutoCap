# Question bank review document

Bank version 1. 65 items. Generated from `bank/bank.v1.json` by `scripts/bank-review-doc.ts`, so this document always describes exactly what loads.

This is the review artefact required by docs/04 step 2. Keys, rationales and source anchors are shown here for the reviewer; participants never see any of them.

## Summary

| Assessment | Items | Slots | Depth per slot |
|---|---|---|---|
| Test Automation Fundamentals | 20 | 10 | 2, 2, 2, 2, 2, 2, 2, 2, 2, 2 |
| SQL | 23 | 10 | 2, 3, 2, 2, 2, 2, 3, 3, 2, 2 |
| Python | 22 | 10 | 2, 2, 2, 2, 2, 3, 3, 2, 2, 2 |

Total 65 items. The per-slot rule in docs/04 (two items per slot, three for the contested slots SQL 2, 7, 8 and Python 6, 7) yields 65; docs/04 also states a total of 66. The per-slot rule is the operative one and has been followed. This is recorded as decision 10 in DECISIONS.md for the owner to settle.

Machine validation of the assembled bank: no problems.


## Test Automation Fundamentals

### Slot 1 - TA fundamentals

Blueprint: Purpose of automation vs manual testing - single - concept selection.

Required depth: 2 items. Type: single.

#### ta-01-a (single)

A billing team runs its regression checks by hand before each monthly release and is now automating those existing checks. The next release adds a discount scheme and changes the invoice layout. The team's test plan for that release lists four objectives. Which objective does the automation directly achieve?

| | Option |
|---|---|
| **KEY** | The existing checks run the same way each time and return results sooner than by hand. |
|  | The changed invoice layout is judged for how clearly customers can read the amounts on it. |
|  | The new discount scheme is explored for behaviour beyond what its written requirements describe. |
|  | The features carrying the most business risk are identified before testing effort is allocated to them. |

**Rationale.** Key a: automating an existing set of regression checks makes them run in exactly the same way each time and return their results far sooner than the same checks run by hand. Consistent, repeatable execution with faster feedback is the direct purpose of automating checks that already exist. b is wrong because how clearly a customer can read an invoice is a human judgement with no expected result that a script can compare against, so it stays a manual activity whatever else is automated. c is wrong because an automated check can only compare behaviour against the expected result it was given; the automation here covers the existing checks, which predate the discount scheme, and exploring a feature for behaviour that nobody has specified is exploratory testing carried out by a person. Automation may free time for that exploration, but it does not perform it. d is wrong because deciding which features carry the most business risk is an analysis that people make before checks are chosen; automation executes the checks that this analysis selects and does not make the selection.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 1 Introduction and objectives for test automation: purpose of automation, advantages and limitations, automation versus manual testing

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### ta-01-b (single)

A data team loads a reporting database every night. After each load, 60 automated reconciliation checks run against the loaded data, each comparing a total in the database with the matching total in the source files. Tonight's run reports that all 60 checks passed. What can the team conclude from that result?

| | Option |
|---|---|
| **KEY** | Tonight's loaded data met the 60 conditions that the scripted checks evaluate. |
|  | Tonight's loaded data contains no defects, so no further checking of it is needed. |
|  | The 60 reconciliation rules are themselves correct, because every check built on them passed. |
|  | The result cannot be relied on until a tester has repeated the 60 checks by hand. |

**Rationale.** Key a: an automated check can report only on the condition it was scripted to evaluate, so a run in which all 60 checks passed establishes exactly that the loaded data met those 60 scripted conditions. It establishes this consistently and without repeated manual effort, which is the purpose of automating a stable set of checks. b is wrong because the run is silent about anything that no scripted check describes; a defect outside the 60 conditions is invisible to it, so a pass cannot show that the data is free of defects or that no further checking is needed. c is wrong because a pass says nothing about whether the rules themselves are right: a rule that is too lenient, or a check that compares the wrong totals, passes in the same way as a correct one, so the correctness of the rules has to be established separately. d is wrong because the automated checks have already evaluated tonight's data; repeating the same deterministic checks by hand adds no information and is precisely the repeated manual effort that automating them removes.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 1 Introduction and objectives for test automation: purpose of automation, advantages and limitations, automation versus manual testing

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 2 - TA fundamentals

Blueprint: Test automation pyramid - ordering - arrange the layers into the canonical sequence.

Required depth: 2 items. Type: ordering.

#### ta-02-a (ordering)

Arrange the automated test layers of the test automation pyramid from most numerous at the top of this list to fewest.

Elements as authored: e1 Unit tests, e2 API tests, e3 UI tests

Key sequence: 1. Unit tests  2. API tests  3. UI tests

**Rationale.** The pyramid widens toward fast, isolated tests: unit tests run in isolation and are the cheapest to write, run and maintain, so they are the most numerous; API tests need a running service, so there are fewer of them; UI tests drive the whole stack through a rendered interface and are the slowest and most brittle, so they are the fewest. Every other order places a slower, less isolated layer above a faster, more isolated one, which contradicts the pyramid as taught. Taking the five wrong orders in turn, most numerous first: unit, UI, API puts UI tests above API tests; API, unit, UI puts API tests above unit tests; API, UI, unit makes unit tests the fewest, below both API and UI tests; UI, unit, API makes UI tests the most numerous, above both unit and API tests; UI, API, unit is the fully reversed order, the inverted pyramid anti-pattern.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 4 Implementing test automation: test pyramid and layers

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### ta-02-b (ordering)

Arrange the automated test layers of the test automation pyramid by how quickly one test typically runs, from fastest at the top of this list to slowest.

Elements as authored: e1 UI tests, e2 Unit tests, e3 API tests

Key sequence: 1. Unit tests  2. API tests  3. UI tests

**Rationale.** Unit tests run in memory against one unit with no deployed system, so they are the fastest. API tests need a running service and a network call, so they are slower. UI tests drive a browser or screen through the full stack, so they are the slowest. Any other order puts a layer that needs more of the system running above one that needs less, which contradicts the pyramid: placing API tests above unit tests ignores that unit tests need no running service, and placing UI tests above either ignores that UI tests exercise the whole stack through a rendered interface.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 4 Implementing test automation: test pyramid and layers

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 3 - TA fundamentals

Blueprint: Agile testing quadrants - single - place an activity.

Required depth: 2 items. Type: single.

#### ta-03-a (single)

A team runs a load test against a web shop's checkout service to measure response times at 500 concurrent users. In the agile testing quadrants, which quadrant does this activity belong to?

| | Option |
|---|---|
| **KEY** | Technology-facing tests that critique the product |
|  | Technology-facing tests that support the team |
|  | Business-facing tests that support the team |
|  | Business-facing tests that critique the product |

**Rationale.** Key a: performance and load testing is technology-facing (it measures a technical property, response time under load, using tools) and it critiques the product (it evaluates the built system rather than guiding what to build). b is wrong because technology-facing tests that support the team are unit and component tests written to guide development, not measurements of the built system. c is wrong because business-facing tests that support the team are functional and story tests expressed in business terms; response time under load is not a business-facing example. d is wrong because business-facing tests that critique the product are exploratory, usability and acceptance activities, which rely on human judgement rather than tool-driven measurement.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapters 1 and 4: test types and levels, agile testing quadrants

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### ta-03-b (single)

A tester spends an afternoon exploring a web shop's new returns screen without a script, trying unusual sequences of actions to learn how it behaves and to find problems. In the agile testing quadrants, which quadrant does this activity belong to?

| | Option |
|---|---|
|  | Technology-facing tests that critique the product |
|  | Technology-facing tests that support the team |
|  | Business-facing tests that support the team |
| **KEY** | Business-facing tests that critique the product |

**Rationale.** Key d: exploratory testing is business-facing (it evaluates the product from the user's point of view) and it critiques the product (it examines the built system to find problems rather than guiding what to build). a is wrong because technology-facing tests that critique the product are performance, load and security tests driven by tools, not unscripted human exploration. b is wrong because technology-facing tests that support the team are unit and component tests written to guide development. c is wrong because business-facing tests that support the team are functional and story tests defined before or during development to confirm the intended behaviour, whereas exploration examines the finished screen.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapters 1 and 4: test types and levels, agile testing quadrants

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 4 - TA fundamentals

Blueprint: Regression vs progression testing - single - classify a scenario.

Required depth: 2 items. Type: single.

#### ta-04-a (single)

A payments file import gains a new record type. The team writes new tests for the new record type. One of the new tests finds a defect; after the fix, the team re-runs that one test. The team also re-runs the existing settlement and reconciliation tests for the other record types to see that they still pass. Which classification fits the re-run of the existing settlement and reconciliation tests?

| | Option |
|---|---|
| **KEY** | Regression testing |
|  | Progression testing |
|  | Confirmation testing |
|  | Smoke testing |

**Rationale.** Key a: regression testing re-runs existing tests on functionality that was not changed, to confirm that a change elsewhere has not broken it; re-running the settlement and reconciliation tests for the other record types is exactly that. b is wrong because progression testing is the testing of new functionality; that describes the new tests written for the new record type, not the re-run of existing tests. c is wrong because confirmation testing re-runs the specific test that previously failed to confirm that its defect has been fixed; that applies only to the re-run of the one test that found the defect, not to the existing tests for the other record types, which never failed. d is wrong because smoke testing is a small, quick check that the main functions work at all, not a re-run of the existing settlement and reconciliation suite.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 1 Introduction and objectives for test automation: regression testing versus progression testing

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### ta-04-b (single)

A payments batch gains a new currency-conversion step. The team writes new tests that exercise the conversion step for the first time, and it also re-runs the existing settlement tests to see that they still pass. Which classification fits the new tests for the conversion step?

| | Option |
|---|---|
|  | Regression testing |
| **KEY** | Progression testing |
|  | Confirmation testing |
|  | Smoke testing |

**Rationale.** Key b: progression testing is the testing of new functionality, and the stem says these tests exercise the newly added conversion step for the first time. a is wrong because regression testing re-runs existing tests on unchanged functionality to confirm that a change elsewhere has not broken it; in the stem that describes the re-run of the existing settlement tests, not the new tests for the conversion step. c is wrong because confirmation testing re-runs a test that previously failed to confirm that a specific defect has been fixed; the stem mentions no earlier failing test and no defect fix. d is wrong because smoke testing is a quick, broad check that the main functions of a build work at all before further testing; the tests in the stem are written specifically for one newly added step, which is testing of new functionality, not a smoke check of the build.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 1 Introduction and objectives for test automation: regression testing versus progression testing

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 5 - TA fundamentals

Blueprint: Automation candidacy factors - multi - select the strengthening factors.

Required depth: 2 items. Type: multi.

#### ta-05-a (multi)

Select all the factors that strengthen a regression test's case for automation.

| | Option |
|---|---|
| **KEY** | It runs every release. |
| **KEY** | The functionality it covers is stable. |
|  | Its result needs human visual judgement each run. |
|  | Its requirements change frequently. |
| **KEY** | Its expected outcome is known in advance and does not vary between runs. |

Key set: It runs every release. + The functionality it covers is stable. + Its expected outcome is known in advance and does not vary between runs.

**Rationale.** Key a, b and e: repeated execution, stable functionality and an expected outcome that is known in advance and does not vary between runs (a deterministic outcome) are the candidacy factors; each makes the automated check cheaper to keep and its result trustworthy. c is wrong because a result that needs human visual judgement each run has no expected value a script can compare against, so it weakens the case. d is wrong because frequently changing requirements mean the script would need frequent rework, which weakens the case.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 4 Implementing test automation: when to automate, automation candidacy factors

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### ta-05-b (multi)

Select all the properties that strengthen the case for automating a check on a nightly data pipeline.

| | Option |
|---|---|
| **KEY** | It is repeated after every pipeline run. |
| **KEY** | The rule it checks has stayed the same for a year. |
| **KEY** | Its expected result can be computed from the input data. |
|  | A reviewer decides pass or fail by judging a chart. |
|  | It is needed only once, before the pipeline goes live. |

Key set: It is repeated after every pipeline run. + The rule it checks has stayed the same for a year. + Its expected result can be computed from the input data.

**Rationale.** Key a, b and c: a check repeated after every pipeline run gives an automated version many runs over which to repay the effort of scripting it; a rule that has stayed the same for a year is unlikely to force the script to be rewritten; and an expected result computed from the input data gives the script a definite value to compare with the actual result. d is wrong because a verdict that rests on a reviewer's reading of a chart cannot be reduced to a comparison a script can make, so a person would still be needed every run. e is wrong because a check needed only once gives no repeat runs, so the effort of automating it is never repaid.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 4 Implementing test automation: when to automate, automation candidacy factors

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 6 - TA fundamentals

Blueprint: What not to automate - single - pick the weakest candidate from scenarios.

Required depth: 2 items. Type: single.

#### ta-06-a (single)

A web shop team lists four checks it wants to add to its suite. Which check is the weakest candidate for automation?

| | Option |
|---|---|
| **KEY** | Checking whether the redesigned home page looks appealing to shoppers. |
|  | Checking that the order total equals the sum of the line totals for 50 sample baskets. |
|  | Checking that a declined card payment leaves the order in the awaiting-payment state. |
|  | Checking that the nightly stock export has the same row count as the stock table. |

**Rationale.** Key a: whether a page looks appealing is a matter of human judgement with no deterministic expected result for a script to compare against, so it is the weakest candidate. b is wrong because a total that must equal a computed sum is deterministic and repeatable, a strong candidate. c is wrong because the resulting order state is a definite value that a script can read and compare, a strong candidate. d is wrong because a row count compared with a table count is deterministic, repeatable and run every night, a strong candidate.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 4 Implementing test automation: what not to automate

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### ta-06-b (single)

A payments batch team lists four checks it wants to add to its suite. Which check is the weakest candidate for automation?

| | Option |
|---|---|
| **KEY** | Checking that a one-off migration copied every account record, after which its script is retired. |
|  | Checking that each settled payment appears exactly once in the daily settlement file. |
|  | Checking that a payment with an invalid account number is written to the rejects table. |
|  | Checking that the end-of-day totals match the ledger totals after each batch run. |

**Rationale.** Key a: the migration runs once and its script is then retired, so this check will never be needed again; a check that is executed only once cannot repay the effort of scripting it, which makes it the weakest candidate even though its expected result is definite. b is wrong because a settlement file is produced every day and the expected result (each settled payment present exactly once) is definite, so the check is repeatable and deterministic, a strong candidate. c is wrong because the rejects-table rule gives a definite expected outcome and the check belongs to a suite that is run again with every change to the batch, so it is repeatable and deterministic, a strong candidate. d is wrong because totals compared after every batch run are deterministic and highly repeatable, a strong candidate.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 4 Implementing test automation: what not to automate

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 7 - TA fundamentals

Blueprint: Maintenance cost of automation - single - concept.

Required depth: 2 items. Type: single.

#### ta-07-a (single)

The same 100 regression checks have been automated four times against one application, once with each design below. With every release the application's screen layout changes and elements move to new positions, while element identifiers and the API stay the same. Which suite will need the most maintenance effort per release?

| | Option |
|---|---|
| **KEY** | UI tests that find each screen element by its position on the screen. |
|  | UI tests that find each screen element by an identifier looked up in one shared list. |
|  | API tests that build each request in full inside the test that sends it. |
|  | API tests that send each request through one shared client library. |

**Rationale.** Key a: a test that finds elements by screen position is coupled to the layout, and the layout is the one part of the application that changes with every release. Each release moves the elements, the tests no longer find them, and every affected test has to be corrected, so this suite carries the highest maintenance effort per release. The principle is that maintenance cost follows how tightly a suite is coupled to the part of the system that changes most. b is wrong because these tests depend on element identifiers, which stay the same, so a layout change leaves them working; even if an identifier did change later, the shared list would confine the edit to one place. c is wrong because these tests depend on the API, which stays the same, so a layout change has no effect on them; the duplicated request code would cost effort only if the API changed, and the stem says it does not. d is wrong because it depends on the API, which stays the same, and it is the cheapest of the four to maintain, since any future API change would be handled once in the shared library rather than in every test.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 4 Implementing test automation: maintainability; Chapter 8 Continuous improvement: refactoring the automation solution

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### ta-07-b (single)

Each of the 150 automated API tests in a suite has four values written directly into its own code: the base URL of the test environment it calls, the request body it sends, the response code it expects, and the account number of the test customer it uses. The team is about to run the suite against a second test environment that hosts the same release of the system loaded with the same test data. Which property of the suite means that this move requires an edit in every test?

| | Option |
|---|---|
| **KEY** | The base URL of the test environment is written into every test. |
|  | The request body of each call is written into every test. |
|  | The expected response code of each call is written into every test. |
|  | The account number of the test customer is written into every test. |

**Rationale.** Key a: the base URL is the address of the environment, so it is the one value that is different for a second environment; because each of the 150 tests holds its own copy of it, all 150 tests have to be edited before the suite can run there, and this is the maintainability cost of writing environment-specific values into the tests instead of holding them once in a configuration read at run time, which would make the move a single change. b is wrong because the request body is defined by the API of the release under test; the second environment hosts the same release, so every test sends the same body and no test changes. c is wrong because the expected response code depends on how the release behaves for a given request and data; with the same release and the same test data the expected codes are unchanged. d is wrong because the account number identifies a record in the test data, and the same test data is loaded in the second environment, so the same account exists there and the value stays as it is. A copy of a value in every test costs maintenance only when that value changes, and the environment move changes the base URL alone.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 4 Implementing test automation: maintainability; Chapter 5 Implementation and deployment strategies: environments and configuration management

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 8 - TA fundamentals

Blueprint: Evidence on failure - multi - what a useful failure record contains.

Required depth: 2 items. Type: multi.

#### ta-08-a (multi)

An automated API test for an order-creation endpoint fails during a nightly run. Select all the pieces of information the failure record should contain so that the failure can be investigated later without re-running the test.

| | Option |
|---|---|
| **KEY** | The expected value and the actual value at the step that failed. |
| **KEY** | The build identifier and environment the test ran against. |
| **KEY** | The log output captured when the test failed, including the response received. |
|  | The average duration of the suite over the last month. |
|  | The date the test was added to the suite and the sprint it was written in. |
|  | The total number of tests in the suite and the number of endpoints it covers. |

Key set: The expected value and the actual value at the step that failed. + The build identifier and environment the test ran against. + The log output captured when the test failed, including the response received.

**Rationale.** Key a, b and c: the expected and actual values show what went wrong, the build identifier and environment show which version of the system failed and where it was running, and the log output with the response received shows the state at the moment of failure, which together let an investigator work from the record alone. d is wrong because an average duration is a trend metric about the suite as a whole with no bearing on why this test failed. e is wrong because when the test was written is history about the test's origin, not evidence about the failure. f is wrong because the size and coverage of the suite are static properties with no bearing on why this test failed.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 6 Test automation reporting and metrics: logging and failure evidence

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### ta-08-b (multi)

A nightly data pipeline includes a reconciliation check that compares the rows it loaded with the rows in the source. On one night the check reports a failure. The next morning an investigator has only the failure record to work from and cannot re-run the check. Select all the items the record needs to hold for the investigator to establish what went wrong.

| | Option |
|---|---|
| **KEY** | The rule that was evaluated and the identifiers of the input data it used. |
| **KEY** | The identifier of the pipeline run and the time at which the check failed. |
| **KEY** | The rows that did not match, showing the expected and the actual values. |
|  | The name of the team member who wrote the check. |
|  | The average duration of the pipeline over the last month. |
|  | The planned date of the next change to the pipeline. |

Key set: The rule that was evaluated and the identifiers of the input data it used. + The identifier of the pipeline run and the time at which the check failed. + The rows that did not match, showing the expected and the actual values.

**Rationale.** Key a, b and c. The rule and the identifiers of its input data tell the investigator what was compared and against which data, so the comparison can be traced back to its inputs. The run identifier and the failure time tie the failure to one specific execution and to the state of the pipeline at that moment. The mismatched rows with their expected and actual values are the direct evidence of what the check found. Together these let the investigator reconstruct the failure from the record without a re-run. d is wrong because the author of the check is a fact about the check's ownership that is the same on every run, so it says nothing about what happened in this run. e is wrong because a monthly average of run duration summarises past runs and carries no detail about the run in which the check failed. f is wrong because a change planned for the future has not yet been made, so it cannot explain a failure that has already occurred.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 6 Test automation reporting and metrics: logging and failure evidence

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 9 - TA fundamentals

Blueprint: Run triggers - matching - place scenarios onto the trigger that fits.

Required depth: 2 items. Type: matching.

#### ta-09-a (matching)

Place each scenario onto the run trigger that fits it.

Buckets: On commit, Scheduled, Pre-release, On demand

Assignment:

- **On commit**: A component test suite that starts automatically each time a change is merged to the shared branch.; An API test suite that the pipeline starts automatically on every push to the shared branch.
- **Scheduled**: A database reconciliation suite that runs at 06:00 every morning against the test environment.
- **Pre-release**: A full regression pack that the release pipeline runs against the release candidate as the last gate before it is deployed to production.
- **On demand**: A run that a tester starts by hand to reproduce a failure reported on the test environment.

**Rationale.** t1 and t5 are On commit: each is started by a change entering the shared branch (a merge in t1, a push in t5) and by nothing else, so neither runs to a clock, at a release point or at a person's request. t2 is Scheduled: it runs at a fixed time (06:00 every morning) whether or not any change, release or request has occurred, so it is not tied to a commit, a release or a person. t3 is Pre-release: it is run by the release pipeline as the last gate before the release candidate is deployed to production, so its trigger is the approaching release, not a commit, a timetable or a person's request. t4 is On demand: it is started by hand by a tester for one specific purpose (reproducing a reported failure), not by a commit, a fixed time or a release step. Every scenario names its trigger's defining property (a merge or push, a fixed time, a deployment about to happen, a person starting one run), so no token fits two buckets.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 5 Implementation and deployment strategies: CI/CD pipelines and run triggers

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### ta-09-b (matching)

Place each scenario onto the run trigger that fits it.

Buckets: On commit, Scheduled, Pre-release, On demand

Assignment:

- **On commit**: An API test suite triggered by each commit to the main branch.
- **Scheduled**: A data quality check that runs every weekday at 06:00.; A performance suite that runs every Sunday at 03:00.
- **Pre-release**: A full regression run as the final check before release approval.
- **On demand**: A run a tester starts manually to reproduce a reported defect.

**Rationale.** t1 is On commit: it is triggered by a change entering the main branch (each commit) and nothing else; it names no time, no release and no person, so Scheduled, Pre-release and On demand do not fit. t2 and t5 are Scheduled: each runs at a fixed time (every weekday at 06:00, every Sunday at 03:00) regardless of any change or release; neither names a commit, a release or a person, so On commit, Pre-release and On demand do not fit. t3 is Pre-release: it is tied to the release approval point, the last check before a release goes ahead, not to a commit or a clock; it names no commit, no time and no person starting it, so On commit, Scheduled and On demand do not fit. t4 is On demand: it is started by a person for one specific purpose (reproducing a reported defect), not by a commit, a timetable or a release; it names no commit, no time and no release, so On commit, Scheduled and Pre-release do not fit. Each scenario names its trigger's defining property (a commit, a fixed time, a release about to be approved, a person starting one run), so no token fits two buckets.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 5 Implementation and deployment strategies: CI/CD pipelines and run triggers

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 10 - TA fundamentals

Blueprint: Flaky tests - single - recognise the concept and the correct response.

Required depth: 2 items. Type: single.

#### ta-10-a (single)

An automated check compares the row totals in a nightly extract against its source table, using a fixed set of test data. The check passes on most runs and fails on about one run in ten. Nothing in the check, the test data or the extract job changes between runs. Which response fits this situation?

| | Option |
|---|---|
| **KEY** | Treat the check as unreliable and investigate the cause of the varying result before trusting it. |
|  | Delete the check from the suite so that its failures stop interrupting the nightly run. |
|  | Configure the nightly run to retry the check until it passes and report the eventual pass. |
|  | Raise a defect against the extract job at each failure, treating the failure as a fault in the job. |

**Rationale.** Key a: a check whose result varies while the check, the test data and the extract job all stay the same is flaky (non-deterministic), and the correct response is to find and fix the cause of the variation (commonly timing, such as reading the extract before the job has finished writing it, or shared state between runs) so that its result can be trusted again. b is wrong because deleting the check discards its coverage permanently and learns nothing about whether the cause lies in the check or in the extract job; stopping the interruptions is not the same as resolving the problem. c is wrong because retrying until a pass and reporting only the pass hides the varying result instead of resolving it, and a genuine intermittent fault in the extract job would be hidden with it. d is wrong because treating every failure as a fault in the job assumes the extract job is at fault without evidence; the cause of a flaky result is often in the check itself, and raising a defect at each failure records the symptom repeatedly without finding the cause.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 7 Verifying the test automation solution: flaky tests and non-deterministic results

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### ta-10-b (single)

A data pipeline runs an automated reconciliation check every night. In one week the check fails on Monday, passes on Tuesday and Wednesday, fails on Thursday and passes on Friday. The check, the input data and the pipeline are the same on every night of the week. Which conclusion fits these results?

| | Option |
|---|---|
| **KEY** | It is a flaky check, and the cause of its inconsistent results must be found before any of them is relied on. |
|  | It has detected a new pipeline defect on Monday and a second new pipeline defect on Thursday. |
|  | It is a passing check, because Friday's run is the most recent result and the most recent result is the one that counts. |
|  | It only needs a retry rule, so the nightly run should run it again after each failure and report the eventual pass. |

**Rationale.** Key a: a check that gives different results on different nights while the check, the data and the pipeline stay the same is flaky (non-deterministic). Flakiness describes the observed pattern, not where the cause lies; the cause may be in the check, in its environment or in the pipeline, and only investigation can tell, so none of the week's results can be relied on until the cause has been found. b is wrong because nothing in the pipeline changed during the week, so no new defect could have been introduced on Monday or on Thursday, and the same fault cannot be found as new twice; the results give no evidence that the cause lies in the pipeline rather than in the check or its environment, which is exactly what investigation must establish. c is wrong because the most recent pass does not account for the two failures; a check that gives different answers to the same question cannot be trusted on any night until the cause is known, and taking the latest result as the answer would also hide a real intermittent fault in the pipeline. d is wrong because retrying until a pass appears hides the inconsistency instead of resolving it, and a real intermittent fault in the pipeline would be hidden with it; the check's results become trustworthy only when the cause has been found and removed.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 7 Verifying the test automation solution: flaky tests and non-deterministic results

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

## SQL

### Slot 1 - SQL foundations

Blueprint: SELECT and WHERE against a shown table - single - predict the result.

Required depth: 2 items. Type: single.

#### sql-01-a (single)

The table `products` holds these rows.

| id | name | category | price |
|---|---|---|---|
| 1 | Pen | stationery | 2 |
| 2 | Desk | furniture | 150 |
| 3 | Lamp | furniture | 40 |
| 4 | Chair | furniture | 85 |
| 5 | Pad | stationery | 5 |

Which names does `SELECT name FROM products WHERE category = 'furniture' AND price < 100;` return?

| | Option |
|---|---|
| **KEY** | Lamp and Chair |
|  | Desk, Lamp and Chair |
|  | Pen, Lamp, Chair and Pad |
|  | Desk |

**Rationale.** Both conditions must hold for a row to be returned. Lamp (40) and Chair (85) are furniture priced below 100, so option a is correct. Option b ignores the price condition and includes Desk at 150. Option c ignores the category condition and returns every row priced below 100, including the two stationery items. Option d reads the comparison the wrong way round and returns the only furniture item priced above 100. Verified by running the query against the shown rows.

**Source anchor.** Intermediate SQL - data filtering: multiple conditions

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-01-b (single)

The table `bookings` has three columns: `id`, `guests` and `status`. It holds five rows, written as (id, guests, status): (1, 2, confirmed), (2, 4, cancelled), (3, 3, confirmed), (4, 1, confirmed) and (5, 5, pending).

Which ids does this query return?

```sql
SELECT id
FROM bookings
WHERE status = 'confirmed' AND guests >= 2;
```

| | Option |
|---|---|
| **KEY** | 1 and 3 |
|  | 1, 3 and 4 |
|  | 1, 2, 3 and 5 |
|  | 3 |

**Rationale.** Both conditions must hold for a row to be returned. Bookings 1 (2 guests) and 3 (3 guests) are confirmed with at least 2 guests, so option a is correct. Option b ignores the guests condition and includes booking 4, which is confirmed but has 1 guest. Option c ignores the status condition and returns every booking with at least 2 guests, including the cancelled booking 2 and the pending booking 5. Option d treats >= as a strict greater-than and drops booking 1, which has exactly 2 guests. Verified by running the query and each distractor's query against the shown rows.

**Source anchor.** Intermediate SQL - data filtering: multiple conditions

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 2 - SQL foundations (contested)

Blueprint: INNER vs LEFT JOIN - single - predict row counts from two small tables. Contested slot.

Required depth: 3 items. Type: single.

#### sql-02-a (single)

The tables `customers` and `orders` hold these rows.

| customers.id |
|---|
| 1 |
| 2 |
| 3 |

| orders.customer_id |
|---|
| 1 |
| 1 |
| 3 |
| 4 |

How many rows does `SELECT * FROM customers INNER JOIN orders ON customers.id = orders.customer_id` return?

| | Option |
|---|---|
|  | 2 |
| **KEY** | 3 |
|  | 4 |
|  | 5 |

Presented in the authored order (fixedOrder).

**Rationale.** An INNER JOIN returns one row per matching pair. Customer 1 matches two orders and customer 3 matches one, giving 3 rows, so option b is correct. Customer 2 has no orders and the order for customer 4 has no customer, so neither contributes a row. Option a counts only the two distinct customers that have orders, customers 1 and 3, and misses the second order for customer 1. Option c counts every order row, including the unmatched order for customer 4; it is also the row count a LEFT JOIN would give, because that join keeps customer 2 with NULL order columns. Option d adds a row for each unmatched side, customer 2 and the order for customer 4, which only a full outer join would do. Verified by running the query against the shown rows.

**Source anchor.** Joining Data in SQL - combining data horizontally: INNER JOIN

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-02-b (single)

The tables `employees` and `tickets` hold these rows.

| employees.id |
|---|
| 10 |
| 20 |
| 30 |
| 40 |

| tickets.employee_id |
|---|
| 10 |
| 30 |
| 30 |
| 50 |

How many rows does `SELECT * FROM employees LEFT JOIN tickets ON employees.id = tickets.employee_id;` return?

| | Option |
|---|---|
|  | 3 |
|  | 4 |
| **KEY** | 5 |
|  | 6 |

Presented in the authored order (fixedOrder).

**Rationale.** A LEFT JOIN keeps every row of the left table. Employee 10 matches one ticket, employee 30 matches two, and employees 20 and 40 each appear once with NULL ticket columns, giving 5 rows, so option c is correct. The ticket for employee 50 has no employee and is dropped because it is on the right side. Option a is the INNER JOIN count, which drops the two unmatched employees. Option b counts one row per employee and misses the second ticket for employee 30. Option d also adds a row for the unmatched ticket, which only a full outer join would do. Verified by running the query against the shown rows.

**Source anchor.** Joining Data in SQL - combining data horizontally: LEFT JOIN

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-02-c (single)

The tables `departments` and `staff` hold these rows.

| departments.id |
|---|
| 1 |
| 2 |
| 3 |

| staff.dept_id |
|---|
| 2 |
| 2 |
| 3 |
| 3 |
| 5 |

How many rows does `SELECT * FROM staff LEFT JOIN departments ON staff.dept_id = departments.id;` return?

| | Option |
|---|---|
|  | 3 |
|  | 4 |
| **KEY** | 5 |
|  | 6 |

Presented in the authored order (fixedOrder).

**Rationale.** A LEFT JOIN keeps every row of the left table, which here is staff. The two staff rows for department 2 and the two for department 3 each match one department row, and the staff row for department 5 has no department so it is kept with NULL department columns, giving 5 rows, so option c is correct. Department 1 has no staff and is dropped because it is on the right side. Option a counts the department rows rather than the result rows. Option b is the INNER JOIN count, which drops the unmatched staff row for department 5. Option d also adds a row for the unmatched department 1, which only a full outer join would do. Verified by running the query against the shown rows.

**Source anchor.** Joining Data in SQL - combining data horizontally: LEFT JOIN

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 3 - SQL foundations

Blueprint: Aggregation with GROUP BY and HAVING - single - predict the result.

Required depth: 2 items. Type: single.

#### sql-03-a (single)

The table `orders` holds these rows.

| id | category | amount |
|---|---|---|
| 1 | stationery | 40 |
| 2 | furniture | 35 |
| 3 | stationery | 60 |
| 4 | lighting | 30 |
| 5 | furniture | 20 |

Which rows does `SELECT category, SUM(amount) AS total FROM orders GROUP BY category HAVING SUM(amount) > 50;` return?

| | Option |
|---|---|
| **KEY** | stationery with total 100 and furniture with total 55 |
|  | stationery with total 100, furniture with total 55 and lighting with total 30 |
|  | stationery with total 60 |
|  | stationery with total 100 |

**Rationale.** GROUP BY produces one row per category with the summed amount: stationery 100, furniture 55, lighting 30. HAVING then keeps only groups whose sum exceeds 50, which leaves stationery and furniture, so option a is correct. Option b ignores the HAVING clause and keeps lighting. Option c applies the condition to individual rows before grouping, as a WHERE clause would, keeping only the single order of 60. Option d drops furniture, whose total of 55 is above 50. Verified by running the query against the shown rows.

**Source anchor.** Intermediate SQL - data aggregation: one grouping column and filtering groups with HAVING

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-03-b (single)

The table `sales` holds these rows.

| id | region | amount |
|---|---|---|
| 1 | North | 120 |
| 2 | South | 80 |
| 3 | North | 40 |
| 4 | East | 200 |
| 5 | South | 60 |

Which rows does `SELECT region, AVG(amount) AS average FROM sales GROUP BY region HAVING AVG(amount) >= 80;` return?

| | Option |
|---|---|
| **KEY** | North with average 80 and East with average 200 |
|  | North with average 80, South with average 70 and East with average 200 |
|  | North with average 120, South with average 80 and East with average 200 |
|  | East with average 200 |

**Rationale.** GROUP BY produces one row per region with the average amount: North (120 + 40) / 2 = 80, South (80 + 60) / 2 = 70, East 200. HAVING then keeps only the groups whose average is at least 80, which leaves North and East, so option a is correct. Option b ignores the HAVING clause and keeps South. Option c applies the condition to individual rows before grouping, as a WHERE clause would, discarding the 40 and 60 rows and then averaging what is left in each region. Option d treats >= as a strict greater-than and drops North, whose average is exactly 80. Some databases display the averages with trailing zeros after the decimal point; the values are exactly 80 and 200. Verified by running the query against the shown rows.

**Source anchor.** Intermediate SQL - data aggregation: one grouping column and filtering groups with HAVING

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 4 - SQL foundations

Blueprint: Subquery reading - single - what does this return.

Required depth: 2 items. Type: single.

#### sql-04-a (single)

The table `products` holds these rows.

| id | name | price |
|---|---|---|
| 1 | Pen | 2 |
| 2 | Desk | 150 |
| 3 | Lamp | 40 |
| 4 | Chair | 85 |
| 5 | Pad | 5 |

What does `SELECT name FROM products WHERE price > (SELECT AVG(price) FROM products);` return?

| | Option |
|---|---|
| **KEY** | Desk and Chair |
|  | Desk |
|  | Pen, Lamp and Pad |
|  | A single value, 56.4 |

**Rationale.** The subquery runs first and returns the average price, 282 divided by 5, which is 56.4. The outer query then returns the names priced above that: Desk (150) and Chair (85), so option a is correct. Option b keeps only the highest price, as if the subquery returned MAX rather than AVG. Option c returns the products priced below the average, reversing the comparison. Option d is the value of the inner subquery, which is used in the comparison and is not what the outer SELECT returns. Verified by running the query against the shown rows.

**Source anchor.** Joining Data in SQL - subqueries inside WHERE

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-04-b (single)

The table `staff` holds these rows.

| id | name | dept | city |
|---|---|---|---|
| 1 | Ana | Sales | Leeds |
| 2 | Ben | Support | York |
| 3 | Cal | Sales | York |
| 4 | Dee | Finance | Bath |
| 5 | Eli | Support | Leeds |

What does this query return?

```sql
SELECT name
FROM staff
WHERE dept IN (SELECT dept FROM staff WHERE city = 'Leeds');
```

| | Option |
|---|---|
| **KEY** | Ana, Ben, Cal and Eli |
|  | Ana and Eli |
|  | Sales and Support |
|  | Ana and Cal |

**Rationale.** The subquery runs first and returns the departments that have someone in Leeds: Sales and Support. The outer query then returns every member of those departments, whatever their city: Ana, Ben, Cal and Eli, so option a is correct. Option b returns only the staff based in Leeds, as if the city condition applied to the outer query. Option c is the result of the inner subquery, which feeds the IN list and is not what the outer SELECT returns. Option d uses only the first department from the subquery and misses the Support staff. Verified by running the query against the shown rows.

**Source anchor.** Joining Data in SQL - subqueries inside WHERE

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 5 - SQL foundations

Blueprint: NULL behaviour in filters and comparisons - single - predict the result.

Required depth: 2 items. Type: single.

#### sql-05-a (single)

The table `tickets` holds these rows. NULL means no team has been assigned.

| id | team |
|---|---|
| 1 | alpha |
| 2 | beta |
| 3 | NULL |
| 4 | NULL |
| 5 | gamma |

What value does `SELECT COUNT(*) FROM tickets WHERE team <> 'alpha';` return?

| | Option |
|---|---|
|  | 1 |
| **KEY** | 2 |
|  | 4 |
|  | 5 |

Presented in the authored order (fixedOrder).

**Rationale.** A comparison with NULL is neither true nor false, so the WHERE clause rejects the two NULL rows. Only beta and gamma compare as different from alpha, giving a count of 2, so option b is correct. Option a counts the single row equal to alpha, reversing the condition. Option c treats the NULL rows as different from alpha and counts them too. Option d counts every row in the table. Verified by running the query against the shown rows.

**Source anchor.** Intermediate SQL - data filtering: complex filtering

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-05-b (single)

The table `items` holds these rows. NULL means the price is missing.

| id | price |
|---|---|
| 1 | 15 |
| 2 | NULL |
| 3 | 25 |
| 4 | 10 |
| 5 | NULL |

What value does this query return?

```sql
SELECT COUNT(*)
FROM items
WHERE price < 20;
```

| | Option |
|---|---|
| **KEY** | 2 |
|  | 3 |
|  | 4 |
|  | 5 |

Presented in the authored order (fixedOrder).

**Rationale.** A comparison with NULL is neither true nor false, so the WHERE clause rejects the two NULL rows. Only 15 and 10 are below 20, giving a count of 2, so option a is correct. Option b counts the rows that have a price at all. Option c treats the NULL rows as below 20 and counts them too. Option d counts every row in the table. Verified by running the query against the shown rows.

**Source anchor.** Intermediate SQL - data filtering: NULL values in comparisons

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 6 - SQL foundations

Blueprint: DISTINCT and ORDER BY - single - predict the result.

Required depth: 2 items. Type: single.

#### sql-06-a (single)

The table `offices` holds these rows.

| id | city |
|---|---|
| 1 | Leeds |
| 2 | York |
| 3 | Leeds |
| 4 | Bath |
| 5 | York |

Which values does this query return, in the order returned?

```sql
SELECT DISTINCT city
FROM offices
ORDER BY city;
```

| | Option |
|---|---|
| **KEY** | Bath, Leeds, York |
|  | Leeds, York, Bath |
|  | Bath, Leeds, Leeds, York, York |
|  | York, Leeds, Bath |

**Rationale.** DISTINCT removes the repeated cities, leaving Bath, Leeds and York, and ORDER BY city sorts them ascending, so option a is correct. Option b removes the duplicates but lists them in order of first appearance, ignoring the ORDER BY. Option c sorts the rows but keeps the duplicates, ignoring DISTINCT. Option d sorts descending, which the query does not ask for. Verified by running the query against the shown rows.

**Source anchor.** Intermediate SQL - data transformation: DISTINCT and ORDER BY

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-06-b (single)

The table `tickets` holds these rows.

| id | status |
|---|---|
| 1 | open |
| 2 | closed |
| 3 | open |
| 4 | pending |
| 5 | closed |

Which values does this query return, in the order returned?

```sql
SELECT DISTINCT status
FROM tickets
ORDER BY status DESC;
```

| | Option |
|---|---|
| **KEY** | pending, open, closed |
|  | closed, open, pending |
|  | open, closed, pending |
|  | pending, open, open, closed, closed |

**Rationale.** DISTINCT removes the repeated statuses, leaving closed, open and pending, and ORDER BY status DESC sorts them descending, so option a is correct. Option b sorts ascending, ignoring DESC. Option c removes the duplicates but lists them in order of first appearance, ignoring the ORDER BY. Option d sorts descending but keeps the duplicates, ignoring DISTINCT. Verified by running the query against the shown rows.

**Source anchor.** Intermediate SQL - data transformation: DISTINCT and ORDER BY

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 7 - SQL applied (contested)

Blueprint: Set operations for reconciliation - single - choose the query for a comparison goal. Contested slot.

Required depth: 3 items. Type: single.

#### sql-07-a (single)

A tester is reconciling two extracts. The tables `source` and `target` each hold an `id` column.

| source.id |
|---|
| 101 |
| 102 |
| 103 |
| 104 |

| target.id |
|---|
| 102 |
| 104 |
| 105 |

Which query returns the ids that appear in both tables, giving 102 and 104?

| | Option |
|---|---|
| **KEY** | SELECT id FROM source INTERSECT SELECT id FROM target |
|  | SELECT id FROM source UNION SELECT id FROM target |
|  | SELECT id FROM source EXCEPT SELECT id FROM target |
|  | SELECT id FROM target EXCEPT SELECT id FROM source |

**Rationale.** INTERSECT returns the rows common to both result sets, which here is 102 and 104, so option a is correct. Option b returns every id from either table, 101 to 105. Option c returns the ids in source that are absent from target, 101 and 103. Option d returns the ids in target that are absent from source, 105. Each query was run against the shown rows and only option a produces 102 and 104.

**Source anchor.** SQL for Testers - validating data integrity with set operations (INTERSECT)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-07-b (single)

A tester is reconciling two extracts. The tables `source` and `target` each hold an `id` column.

| source.id |
|---|
| 201 |
| 202 |
| 203 |

| target.id |
|---|
| 202 |
| 203 |
| 204 |
| 205 |

Which query returns every id that appears in either table, listing each id once, giving 201, 202, 203, 204 and 205?

| | Option |
|---|---|
| **KEY** | SELECT id FROM source UNION SELECT id FROM target |
|  | SELECT id FROM source UNION ALL SELECT id FROM target |
|  | SELECT id FROM source INTERSECT SELECT id FROM target |
|  | SELECT id FROM source EXCEPT SELECT id FROM target |

**Rationale.** UNION combines both result sets and removes duplicate rows, giving each of the five ids once, so option a is correct. Option b keeps duplicates, so 202 and 203 each appear twice and seven rows are returned. Option c returns only the ids common to both tables, 202 and 203. Option d returns the ids in source that are absent from target, 201. Each query was run against the shown rows and only option a produces the five ids once each.

**Source anchor.** SQL for Testers - validating data integrity with set operations (UNION); Joining Data in SQL - combining data vertically

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-07-c (single)

A tester is reconciling two extracts. The tables `source` and `target` each hold `id` and `amount` columns.

| source.id | source.amount |
|---|---|
| 1 | 100 |
| 2 | 250 |
| 3 | 75 |

| target.id | target.amount |
|---|---|
| 1 | 100 |
| 2 | 200 |
| 3 | 75 |
| 4 | 50 |

Which query returns the rows whose id and amount are both the same in the two tables, giving (1, 100) and (3, 75)?

| | Option |
|---|---|
| **KEY** | SELECT id, amount FROM source INTERSECT SELECT id, amount FROM target |
|  | SELECT id FROM source INTERSECT SELECT id FROM target |
|  | SELECT s.id, s.amount FROM source s INNER JOIN target t ON s.id = t.id |
|  | SELECT id, amount FROM source EXCEPT SELECT id, amount FROM target |

**Rationale.** INTERSECT over both columns keeps only the rows that match on id and amount together, which is (1, 100) and (3, 75), so option a is correct. Option b compares ids alone and returns 1, 2 and 3, including id 2 whose amounts differ. Option c joins on id alone and returns all three source rows with their source amounts, again including id 2. Option d returns the source rows that have no exact match in target, (2, 250), which is the opposite of the goal. Each query was run against the shown rows and only option a produces (1, 100) and (3, 75).

**Source anchor.** SQL for Testers - validating data integrity with set operations (INTERSECT over several columns)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 8 - SQL applied (contested)

Blueprint: Find records missing from a target - single - choose the query, tables shown. Contested slot.

Required depth: 3 items. Type: single.

#### sql-08-a (single)

A load job copies rows from `source` into `target`. After the run the tables hold these ids.

| source.id |
|---|
| 101 |
| 102 |
| 103 |
| 104 |

| target.id |
|---|
| 101 |
| 103 |

Which query returns the ids present in source but absent from target, giving 102 and 104?

| | Option |
|---|---|
| **KEY** | SELECT id FROM source EXCEPT SELECT id FROM target |
|  | SELECT id FROM source INTERSECT SELECT id FROM target |
|  | SELECT id FROM source UNION SELECT id FROM target |
|  | SELECT id FROM target EXCEPT SELECT id FROM source |

**Rationale.** EXCEPT returns the rows of the left query that do not appear in the right query, the reconciliation primitive for finding what failed to arrive, giving 102 and 104, so option a is correct. Option b returns the ids in both tables, 101 and 103, which are the rows that did arrive. Option c returns every id from either table, 101 to 104. Option d is the reversed form and finds the opposite gap, ids in target that are absent from source, which here is nothing. Each query was run against the shown rows and only option a produces 102 and 104.

**Source anchor.** SQL for Testers - validating data integrity: finding rows missing from a target (EXCEPT)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-08-b (single)

A load job copies orders from `expected` into `loaded`. After the run the tables hold these order ids.

| expected.order_id |
|---|
| 501 |
| 502 |
| 503 |
| 504 |
| 505 |

| loaded.order_id |
|---|
| 501 |
| 503 |
| 505 |

Which query returns the order ids present in expected but absent from loaded, giving 502 and 504?

| | Option |
|---|---|
| **KEY** | SELECT e.order_id FROM expected e LEFT JOIN loaded l ON e.order_id = l.order_id WHERE l.order_id IS NULL |
|  | SELECT e.order_id FROM expected e INNER JOIN loaded l ON e.order_id = l.order_id |
|  | SELECT e.order_id FROM expected e LEFT JOIN loaded l ON e.order_id = l.order_id WHERE l.order_id IS NOT NULL |
|  | SELECT l.order_id FROM loaded l LEFT JOIN expected e ON l.order_id = e.order_id WHERE e.order_id IS NULL |

**Rationale.** A LEFT JOIN keeps every expected row and fills the loaded columns with NULL where there is no match, so filtering on l.order_id IS NULL isolates the rows that never arrived, 502 and 504, and option a is correct. Option b keeps only the matched rows, 501, 503 and 505, the opposite of the goal. Option c keeps the matched rows too, because IS NOT NULL selects the rows that did find a partner. Option d starts from loaded and looks for loaded rows with no expected partner, which here returns nothing. Each query was run against the shown rows and only option a produces 502 and 504.

**Source anchor.** SQL for Testers - validating data integrity: finding rows missing from a target (LEFT JOIN with IS NULL)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-08-c (single)

A release job publishes product codes from `staging` into `live`. After the run the tables hold these codes. The code column has no NULL values.

| staging.code |
|---|
| A1 |
| A2 |
| A3 |
| A4 |

| live.code |
|---|
| A1 |
| A4 |

Which query returns the codes present in staging but absent from live, giving A2 and A3?

| | Option |
|---|---|
| **KEY** | SELECT code FROM staging WHERE code NOT IN (SELECT code FROM live) |
|  | SELECT code FROM staging WHERE code IN (SELECT code FROM live) |
|  | SELECT code FROM live WHERE code NOT IN (SELECT code FROM staging) |
|  | SELECT s.code FROM staging s INNER JOIN live l ON s.code = l.code |

**Rationale.** The subquery lists the codes that reached live, and NOT IN keeps the staging codes that are missing from that list, A2 and A3, so option a is correct. Option b keeps the staging codes that did reach live, A1 and A4, the opposite of the goal. Option c is the reversed form and looks for live codes that are absent from staging, which here returns nothing. Option d is an inner join, which also returns only the matched codes A1 and A4. Each query was run against the shown rows and only option a produces A2 and A3.

**Source anchor.** SQL for Testers - validating data integrity: finding rows missing from a target (NOT IN subquery)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 9 - SQL applied

Blueprint: Detect changed values between source and target - single - choose the approach.

Required depth: 2 items. Type: single.

#### sql-09-a (single)

A migration copies balances from `source` to `target`. Both tables hold the same four ids and every amount is present.

| source.id | source.amount |
|---|---|
| 1 | 100 |
| 2 | 250 |
| 3 | 75 |
| 4 | 300 |

| target.id | target.amount |
|---|---|
| 1 | 100 |
| 2 | 200 |
| 3 | 75 |
| 4 | 350 |

Which query returns the ids whose amount differs between the two tables, giving 2 and 4?

| | Option |
|---|---|
| **KEY** | SELECT s.id FROM source s INNER JOIN target t ON s.id = t.id WHERE s.amount <> t.amount |
|  | SELECT s.id FROM source s INNER JOIN target t ON s.id = t.id WHERE s.amount = t.amount |
|  | SELECT id FROM source EXCEPT SELECT id FROM target |
|  | SELECT s.id FROM source s INNER JOIN target t ON s.amount = t.amount |

**Rationale.** Joining the two tables on id pairs each source row with its target row, and the WHERE clause keeps the pairs whose amounts differ, 2 and 4, so option a is correct. Option b keeps the pairs whose amounts are equal, 1 and 3, the opposite of the goal. Option c compares ids only, and because both tables hold the same ids it returns nothing. Option d joins on amount rather than id, which pairs rows by coincidence of value and returns 1 and 3 here. Each query was run against the shown rows and only option a produces 2 and 4.

**Source anchor.** SQL for Testers - validating data integrity: detecting changed values between source and target (join and compare)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-09-b (single)

A synchronisation job copies ticket statuses from `source` to `target`. Both tables hold the same four ids and every status is present.

| source.id | source.status |
|---|---|
| 1 | open |
| 2 | closed |
| 3 | open |
| 4 | pending |

| target.id | target.status |
|---|---|
| 1 | open |
| 2 | open |
| 3 | open |
| 4 | closed |

Which query returns the source rows whose status differs from the row with the same id in target, giving (2, closed) and (4, pending)?

| | Option |
|---|---|
| **KEY** | SELECT id, status FROM source EXCEPT SELECT id, status FROM target |
|  | SELECT id FROM source EXCEPT SELECT id FROM target |
|  | SELECT status FROM source EXCEPT SELECT status FROM target |
|  | SELECT id, status FROM source INTERSECT SELECT id, status FROM target |

**Rationale.** EXCEPT over both columns returns the source rows that have no identical (id, status) row in target. Because every id exists in both tables, those are exactly the rows whose status changed, (2, closed) and (4, pending), so option a is correct. Option b compares ids only and returns nothing, because both tables hold the same ids. Option c compares status values on their own and returns just the value pending, with no ids, because it ignores which row a status belongs to. Option d returns the rows that are identical in both tables, (1, open) and (3, open), the opposite of the goal. Each query was run against the shown rows and only option a produces (2, closed) and (4, pending).

**Source anchor.** SQL for Testers - validating data integrity: detecting changed values between source and target (EXCEPT over several columns)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 10 - SQL applied

Blueprint: Test data hygiene in SQL - multi - inserting and cleaning deterministic test rows.

Required depth: 2 items. Type: multi.

#### sql-10-a (multi)

An automated test inserted the rows with ids 9001 and 9002 into `customers`. The other three rows are permanent data that must stay. The table now holds these rows.

| id | name | city |
|---|---|---|
| 1 | Customer A | Leeds |
| 2 | Customer B | Hull |
| 3 | Customer C | York |
| 9001 | TEST customer one | Leeds |
| 9002 | TEST customer two | Hull |

Which statements delete exactly the two inserted rows and leave the three permanent rows in place, when each statement is run on its own against the table shown?

| | Option |
|---|---|
| **KEY** | DELETE FROM customers WHERE id IN (9001, 9002); |
| **KEY** | DELETE FROM customers WHERE name LIKE 'TEST%'; |
| **KEY** | DELETE FROM customers WHERE id >= 9001; |
|  | DELETE FROM customers; |
|  | DELETE FROM customers WHERE id > 2; |
|  | DELETE FROM customers WHERE city = 'Leeds'; |

Key set: DELETE FROM customers WHERE id IN (9001, 9002); + DELETE FROM customers WHERE name LIKE 'TEST%'; + DELETE FROM customers WHERE id >= 9001;

**Rationale.** Test rows should be created with values that identify them beyond doubt so that clean-up can target them precisely. Option a names the two test ids explicitly. Option b matches the TEST prefix that only the two inserted names carry; no permanent name begins with that text in any letter case. Option c uses the reserved id range that only the test rows occupy. Each of these leaves ids 1, 2 and 3 untouched. Option d has no WHERE clause and deletes every row. Option e also deletes the permanent row with id 3. Option f deletes by city, which removes the permanent Leeds row (id 1) and leaves the test row 9002 behind. Each statement was run against the shown rows and the remaining ids checked.

**Source anchor.** SQL for Testers - using SQL for data generation: create new entries and delete data; test data hygiene

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### sql-10-b (multi)

An automated test needs rows in `accounts` that it can find again on every run. The table was created and populated by this script.

```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL CHECK (balance >= 0)
);
INSERT INTO accounts (id, ref, balance) VALUES (1, 'ACC-001', 120);
INSERT INTO accounts (id, ref, balance) VALUES (2, 'ACC-002', 40);
```

Which of these INSERT statements succeed and add a row, when each statement is run on its own against the table as the script leaves it?

| | Option |
|---|---|
| **KEY** | INSERT INTO accounts (id, ref, balance) VALUES (9001, 'TEST-A', 0); |
|  | INSERT INTO accounts (id, ref, balance) VALUES (1, 'TEST-B', 50); |
|  | INSERT INTO accounts (id, ref, balance) VALUES (9002, 'ACC-001', 50); |
|  | INSERT INTO accounts (id, ref, balance) VALUES (9003, 'TEST-C', -10); |
| **KEY** | INSERT INTO accounts (id, ref, balance) VALUES (9004, 'TEST-D', 250); |
| **KEY** | INSERT INTO accounts (id, balance, ref) VALUES (9005, 75, 'TEST-E'); |

Key set: INSERT INTO accounts (id, ref, balance) VALUES (9001, 'TEST-A', 0); + INSERT INTO accounts (id, ref, balance) VALUES (9004, 'TEST-D', 250); + INSERT INTO accounts (id, balance, ref) VALUES (9005, 75, 'TEST-E');

**Rationale.** A deterministic test row must respect every constraint on the table. Option a uses an unused id, a new reference and a balance of 0, which satisfies balance >= 0. Option e uses an unused id, a new reference and a positive balance. Option f lists the columns in a different order but supplies matching values for each, which is valid. Option b reuses id 1 and is rejected by the primary key. Option c reuses the reference ACC-001 and is rejected by the UNIQUE constraint. Option d supplies a negative balance and is rejected by the CHECK constraint. Each statement was run against the table as the script leaves it and the outcome recorded.

**Source anchor.** SQL for Testers - using SQL for data generation: create new entries; testing SQL queries: field constraints

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

## Python

### Slot 1 - Python core

Blueprint: Types and truthiness - single - predict the output.

Required depth: 2 items. Type: single.

#### python-01-a (single)

What does this code print?

```python
values = [0, 1, "", "no", [], None]
count = 0
for v in values:
    if v:
        count += 1
print(count)
```

| | Option |
|---|---|
|  | 1 |
| **KEY** | 2 |
|  | 3 |
|  | 4 |

Presented in the authored order (fixedOrder).

**Rationale.** The if statement tests each value's truthiness. 1 and "no" are truthy; 0, the empty string, the empty list and None are falsy, so count is 2. 1 treats the non-empty string "no" as falsy because of the word it holds, but any non-empty string is truthy; only the empty string is falsy. 3 treats one of the empty string, the empty list or None as truthy; all three are falsy. 4 treats only 0 and None as falsy; the empty string and the empty list are falsy too.

**Source anchor.** Programming for Everybody - variables and expressions (data types) and conditional code

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-01-b (single)

What does this code print?

```python
count = "3"
total = 0
if count == 3:
    total += 1
if int(count) == 3:
    total += 10
if count:
    total += 100
print(total)
```

| | Option |
|---|---|
|  | 10 |
|  | 100 |
| **KEY** | 110 |
|  | 111 |

Presented in the authored order (fixedOrder).

**Rationale.** count holds the string "3", not the integer 3, so count == 3 is False and 1 is not added. int(count) converts the string to the integer 3, so 10 is added. A non-empty string is truthy, so 100 is added. The total is 110. 111 assumes a string compares equal to an integer with the same digits; it does not. 100 assumes int(count) == 3 is False; the conversion produces exactly 3. 10 assumes the string "3" is falsy; among strings only the empty string is falsy, and "3" is non-empty.

**Source anchor.** Programming for Everybody - variables and expressions (data types) and conditional code

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 2 - Python core

Blueprint: Control flow with a loop and condition - single - predict the output.

Required depth: 2 items. Type: single.

#### python-02-a (single)

What does this code print?

```python
values = [3, 1, 4, 1]
total = 0
for v in values:
    if v > 1:
        total += v
print(total)
```

| | Option |
|---|---|
|  | 4 |
| **KEY** | 7 |
|  | 8 |
|  | 9 |

Presented in the authored order (fixedOrder).

**Rationale.** Only values greater than 1 are added: 3 and 4, giving 7. 9 is the sum of all four values, which ignores the condition. 8 counts one of the 1 values as passing the condition; 1 > 1 is False. 4 comes from reading the code as counting the elements or keeping the largest value; the code sums the values that pass.

**Source anchor.** Programming for Everybody - loops and iteration (definite loops, loop idioms) with conditional code

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-02-b (single)

What does this code print?

```python
scores = [72, 45, 88, 60, 51]
passed = 0
for s in scores:
    if s >= 60:
        passed += 1
print(passed)
```

| | Option |
|---|---|
|  | 2 |
| **KEY** | 3 |
|  | 4 |
|  | 5 |

Presented in the authored order (fixedOrder).

**Rationale.** 72, 88 and 60 satisfy s >= 60, so passed is 3. 2 excludes 60 by reading >= as >; 60 >= 60 is True. 4 includes 51 or 45 by mistake; both are below 60. 5 counts every element, ignoring the condition.

**Source anchor.** Programming for Everybody - loops and iteration (definite loops, loop idioms) with conditional code

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 3 - Python core

Blueprint: Functions, arguments, return values - single - predict the output.

Required depth: 2 items. Type: single.

#### python-03-a (single)

What does this code print?

```python
def diff(first, second):
    return first - second

gap = diff(4, 10)
print(diff(gap, 2))
```

| | Option |
|---|---|
| **KEY** | -8 |
|  | -4 |
|  | 4 |
|  | 8 |

Presented in the authored order (fixedOrder).

**Rationale.** Arguments bind to parameters by position. In diff(4, 10), first is 4 and second is 10, so the call returns 4 - 10, which is -6, and that value is stored in gap. In diff(gap, 2), first is -6 and second is 2, so the call returns -6 - 2, which is -8, and print shows -8. -4 reads both calls as second minus first: 10 - 4 is 6, then 2 - 6 is -4. 4 treats the first call as the positive difference between 4 and 10, giving 6, then computes 6 - 2 correctly; the first parameter is 4, so the first call returns -6, not 6. 8 traces the first call correctly to -6 but reads the second call as 2 minus gap, giving 2 - (-6); the variable gap is the first argument, so it binds to first and the call returns -6 - 2.

**Source anchor.** Programming for Everybody - functions (defining, arguments, return values)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-03-b (single)

What does this code print?

```python
def total(values):
    result = 0
    for v in values:
        result += v

print(total([1, 2, 3]))
```

| | Option |
|---|---|
|  | 6 |
| **KEY** | None |
|  | 0 |
|  | An error is raised because result is a local variable |

**Rationale.** The function computes result but has no return statement, so the call evaluates to None and print shows None. 6 assumes the computed value is returned; without a return statement the value stays inside the function. 0 assumes the initial value leaks out; local variables are not visible to the caller. Calling a function that has no return statement is not an error; the call simply produces None.

**Source anchor.** Programming for Everybody - functions (defining, arguments, return values)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 4 - Python core

Blueprint: Lists and dicts - single - predict the output or pick the correct access.

Required depth: 2 items. Type: single.

#### python-04-a (single)

What does this code print?

```python
counts = {}
for word in ["red", "blue", "red", "green", "red"]:
    counts[word] = counts.get(word, 0) + 1
print(counts["red"], len(counts))
```

| | Option |
|---|---|
| **KEY** | 3 3 |
|  | 3 5 |
|  | 2 3 |
|  | 5 3 |

**Rationale.** counts.get(word, 0) returns the current count, or 0 for a word not yet seen, so every occurrence is counted. red appears three times, so counts["red"] is 3. The dictionary holds one key per distinct word (red, blue, green), so len(counts) is 3. "3 5" takes the length of the list instead of the number of keys. "2 3" misses the first occurrence of red; get supplies 0 for a new key so the first occurrence adds 1. "5 3" treats counts["red"] as the total number of words rather than the count for red.

**Source anchor.** Programming for Everybody - lists and dictionaries (counting with a dictionary)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-04-b (single)

What does this code print?

```python
items = [10, 20, 30]
items.append(40)
items[0] = 5
print(items[1:3], len(items))
```

| | Option |
|---|---|
| **KEY** | [20, 30] 4 |
|  | [20, 30, 40] 4 |
|  | [5, 20] 4 |
|  | [20, 30] 3 |

**Rationale.** After append the list is [10, 20, 30, 40]; assigning items[0] makes it [5, 20, 30, 40]. The slice items[1:3] takes positions 1 and 2 and stops before position 3, giving [20, 30], and len(items) is 4. "[20, 30, 40] 4" includes the end position; a slice excludes it. "[5, 20] 4" starts the slice at position 0; it starts at position 1. "[20, 30] 3" ignores the append; append adds an element to the list in place.

**Source anchor.** Programming for Everybody - lists and dictionaries (list indexing, slicing and methods)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 5 - Python core

Blueprint: String operations - single - predict the output.

Required depth: 2 items. Type: single.

#### python-05-a (single)

What does this code print?

```python
text = "invoice-2024-final.csv"
parts = text.split("-")
print(parts[1], len(parts), text.startswith("Invoice"))
```

| | Option |
|---|---|
| **KEY** | 2024 3 False |
|  | 2024 3 True |
|  | invoice 3 False |
|  | 2024 2 False |

**Rationale.** split("-") gives ["invoice", "2024", "final.csv"]. Indexing starts at 0, so parts[1] is "2024"; len(parts) is 3; string comparison is case sensitive, so text.startswith("Invoice") is False because the text begins with a lower-case "invoice". "2024 3 True" treats the comparison as case insensitive; a capital letter does not match a lower-case one. "invoice 3 False" assumes indexing starts at 1, which would make parts[1] the first element; it starts at 0. "2024 2 False" counts the two separators instead of the three pieces they produce.

**Source anchor.** Programming for Everybody - strings (indexing, methods such as split and startswith, case-sensitive comparison)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-05-b (single)

What does this code print?

```python
code = "ab-123-XYZ"
result = code.replace("-", "").lower()
print(result[5:8], len(result))
```

| | Option |
|---|---|
| **KEY** | xyz 8 |
|  | XYZ 8 |
|  | xyz 10 |
|  | 3xy 8 |

**Rationale.** replace removes both hyphens, giving "ab123XYZ", and lower converts every letter to lower case, giving "ab123xyz", which has 8 characters. Indexes start at 0, so result[5:8] takes positions 5, 6 and 7: "xyz". "XYZ 8" ignores lower; lower returns a new string with the letters in lower case, and that string is what result holds. "xyz 10" reports the original length; replace removed two hyphens, so result has 8 characters, not 10. "3xy 8" counts positions from 1; indexes start at 0, so position 5 of result is "x", not "3".

**Source anchor.** Programming for Everybody - strings (slicing, methods such as replace and lower)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 6 - Python core (contested)

Blueprint: Reading a short realistic snippet end to end - single - predict the output. Contested slot.

Required depth: 3 items. Type: single.

#### python-06-a (single)

A test compares an expected record with the record a service returned. What does this code print?

```python
expected = {"id": 7, "status": "open", "total": 40}
actual = {"id": 7, "status": "closed", "total": 40, "note": ""}
mismatches = []
for key in expected:
    if expected[key] != actual.get(key):
        mismatches.append(key)
print(mismatches)
```

| | Option |
|---|---|
| **KEY** | ['status'] |
|  | ['status', 'note'] |
|  | ['note'] |
|  | [] |

**Rationale.** The loop visits only the keys of expected: id, status and total. id and total hold the same values in both records; status differs (open against closed), so mismatches is ['status']. "['status', 'note']" assumes keys that exist only in actual are visited; the loop iterates over expected. "['note']" treats the extra key as the only difference and misses the changed status. "[]" assumes the records match; the status values differ.

**Source anchor.** Programming for Everybody - lists and dictionaries with loops and conditional code (reading a short program end to end)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-06-b (single)

A test totals the amount column of a small CSV extract held as a list of lines. What does this code print?

```python
rows = ["id,amount", "1,25", "2,x", "3,10"]
total = 0
for row in rows[1:]:
    parts = row.split(",")
    if parts[1].isdigit():
        total += int(parts[1])
print(total)
```

| | Option |
|---|---|
| **KEY** | 35 |
|  | 25 |
|  | 10 |
|  | Nothing, because a ValueError is raised |

**Rationale.** rows[1:] skips the header line, so the loop sees "1,25", "2,x" and "3,10". Splitting each on the comma gives parts[1] of "25", "x" and "10". "25" and "10" pass isdigit and are converted and added, giving 35; "x" fails isdigit, so the if body is skipped for that row and nothing is added. "25" assumes the loop stops at the non-numeric row; there is no break, so the loop continues to "3,10" and adds 10. "10" assumes rows[1:] drops the first two lines; the slice drops only the header, so "1,25" is included. "Nothing, because a ValueError is raised" assumes int() is applied to "x"; the isdigit test is false for "x", so int() is never reached and the program completes normally.

**Source anchor.** Programming for Everybody - strings and lists with loops and conditional code (reading a short program end to end)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-06-c (single)

A test run records each test name together with whether it passed. What does this code print?

```python
results = [("login", False), ("search", False), ("export", False), ("report", True)]
failed = []
passed_count = 0
for name, passed in results:
    if passed:
        passed_count += 1
    else:
        failed.append(name)
print(passed_count, len(failed), failed[-1])
```

| | Option |
|---|---|
| **KEY** | 1 3 export |
|  | 1 3 login |
|  | 3 1 report |
|  | 2 2 export |

**Rationale.** Each pair unpacks into name and passed. login, search and export have passed set to False, so the else branch appends each of them and failed becomes ['login', 'search', 'export']; only report has passed set to True, so passed_count is 1. len(failed) is 3 and failed[-1] is the last element of failed, 'export'. "1 3 login" takes the first element of failed; an index of -1 counts from the end of the list. "3 1 report" swaps the two branches, counting the False results and collecting the one True name. "2 2 export" counts only two failures; three pairs hold False.

**Source anchor.** Programming for Everybody - loops and iteration (loop idioms) with conditional code and lists (reading a short program end to end)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 7 - Python testing (contested)

Blueprint: pytest discovery and naming conventions - multi - select what gets collected. Contested slot.

Required depth: 3 items. Type: multi.

#### python-07-a (multi)

pytest runs with default settings in a folder containing the file `test_orders.py`. The file defines the six functions below at module level. Which of them will pytest collect as tests?

| | Option |
|---|---|
| **KEY** | def test_totals(): |
|  | def check_totals(): |
| **KEY** | def test_empty_input(): |
|  | def totals_test(): |
|  | def Test_discount(): |
|  | def setup_data(): |

Key set: def test_totals(): + def test_empty_input():

**Rationale.** With default settings pytest collects module-level functions whose names begin with the lowercase prefix test, conventionally written test_. test_totals and test_empty_input carry that prefix, so both are collected. check_totals and setup_data do not begin with the prefix, so they are ordinary helper functions and are not collected. totals_test has test at the end; for functions the match is a prefix, not a suffix, so it is not collected. Test_discount begins with a capital T; the prefix match is case-sensitive, and a capitalised Test prefix is the convention for test classes, not for functions, so it is not collected either. Verified by running pytest --collect-only against a module containing all six functions: exactly test_totals and test_empty_input were collected.

**Source anchor.** Python Automation Testing With Pytest - assertions and test discovery (test naming and discovery)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-07-b (multi)

pytest runs with default settings in a folder containing the five files below. Each file contains one function named `test_one` with an assert statement. Which files will pytest collect tests from?

| | Option |
|---|---|
| **KEY** | test_login.py |
|  | check_login.py |
| **KEY** | test_logout.py |
|  | login_helpers.py |
|  | login_tests.py |

Key set: test_login.py + test_logout.py

**Rationale.** With default settings pytest decides which files to look inside by file name: a file whose name starts with test_ is collected as a test module. test_login.py and test_logout.py both start with test_, so pytest collects both and runs their test_one functions. check_login.py and login_helpers.py do not start with test_, so pytest treats them as ordinary modules and never looks inside them, even though each contains a test_one function. login_tests.py also lacks the test_ prefix; it does not qualify under the default suffix pattern either, because that pattern requires the name to end in exactly _test.py and this name ends in _tests.py. Verified by running pytest --collect-only against the five files: only test_login.py::test_one and test_logout.py::test_one were collected.

**Source anchor.** Python Automation Testing With Pytest - assertions and test discovery (test naming and discovery)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-07-c (multi)

pytest runs with default settings in a folder containing `test_cart.py` with the content below. Which of the listed functions and methods will pytest collect as tests?

```python
class TestCart:
    def test_add_item(self):
        assert True
    def verify_stock(self):
        assert True
class TestCartChecks:
    def test_remove_item(self):
        assert True
def test_empty_cart():
    assert True
def checkout_test():
    assert True
```

| | Option |
|---|---|
| **KEY** | TestCart.test_add_item |
|  | TestCart.verify_stock |
| **KEY** | TestCartChecks.test_remove_item |
| **KEY** | test_empty_cart |
|  | checkout_test |

Key set: TestCart.test_add_item + TestCartChecks.test_remove_item + test_empty_cart

**Rationale.** pytest collects functions and methods whose names start with test (the test_ prefix is the conventional form) at module level and inside classes whose names start with Test. Both classes here start with Test, so whether a method is collected depends only on the method's own name. test_add_item and test_remove_item start with test and sit inside TestCart and TestCartChecks, and test_empty_cart is a module-level function starting with test, so all three are collected. verify_stock does not start with test, so it is an ordinary method even though it contains an assert. checkout_test has test at the end; the default rule matches a prefix, not a suffix, so it is not collected.

**Source anchor.** Python Automation Testing With Pytest - assertions and test discovery (test naming and discovery)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 8 - Python testing

Blueprint: assert semantics and failure meaning - single - interpret a failing test.

Required depth: 2 items. Type: single.

#### python-08-a (single)

A test file contains the code below. What does pytest report when it runs `test_get_order`?

```python
def get_order(order_id):
    return {"id": order_id, "status": "Shipped", "items": 2}

def test_get_order():
    order = get_order(7)
    assert order["status"] == "Delivered"
    assert order["items"] == 3
```

| | Option |
|---|---|
| **KEY** | The test fails at `assert order["status"] == "Delivered"`, and the second assert does not run. |
|  | The test fails, and pytest reports both asserts as failed. |
|  | The test passes, because get_order returns a value without raising an exception. |
|  | The test errors, because get_order has no test_ prefix and cannot be called from a test. |

**Rationale.** order["status"] is "Shipped", so the first assert's comparison is False and the assert raises AssertionError. That exception ends test_get_order immediately, so the second assert is never evaluated, and pytest reports one failed test, showing 'Shipped' == 'Delivered' as the compared values. pytest does not carry on past a failed assert to gather further failures, so it never reports both asserts; only the first failing assert appears in the report. A test passes only when every assert it reaches holds; get_order returning normally does not make the test pass, because it is the assert itself that raises the exception. Functions without the test_ prefix are ordinary functions that a test can call freely; the prefix only decides which functions pytest collects as tests, so no error arises from calling get_order.

**Source anchor.** Python Automation Testing With Pytest - assertions and test discovery (assertions); Introduction to Testing in Python - creating tests with pytest

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-08-b (single)

What happens when pytest runs this test?

```python
def test_totals():
    values = [1, 2, 3]
    assert sum(values) == 6
    assert len(values) == 4
    assert max(values) == 3
```

| | Option |
|---|---|
| **KEY** | The test fails at `assert len(values) == 4` and the last assert is not executed. |
|  | The test fails at `assert len(values) == 4` and the last assert still runs and passes. |
|  | The test passes, because two of its three asserts hold. |
|  | The test fails at `assert sum(values) == 6`. |

**Rationale.** sum(values) is 6, so the first assert holds. len(values) is 3, so the second assert raises AssertionError, which ends the function immediately; the third assert never runs, and pytest reports one failure showing 3 == 4. A failed assert stops the test function, so the last assert does not run. A test passes only when every assert it reaches holds; a majority is not enough. The first assert holds, so the failure is not there.

**Source anchor.** Python Automation Testing With Pytest - assertions and test discovery (assertions); Introduction to Testing in Python - creating tests with pytest

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 9 - Python testing

Blueprint: Fixtures and parameterisation - single - purpose selection.

Required depth: 2 items. Type: single.

#### python-09-a (single)

A test file contains the code below. What happens when pytest runs `test_new_order_has_no_lines`?

```python
import pytest

@pytest.fixture
def order():
    return {"id": 42, "lines": []}

def test_new_order_has_no_lines(order):
    assert order["lines"] == []
```

| | Option |
|---|---|
| **KEY** | pytest runs the order fixture function before the test and passes the returned dictionary into the test through the order parameter, and the test passes. |
|  | pytest runs the test once for each key in the dictionary that the order fixture returns, so it is reported twice. |
|  | The test fails with a NameError, because order is used inside the test as a variable that was never assigned. |
|  | pytest collects order as a second test, because the decorator marks it as one, and runs both functions. |

**Rationale.** A fixture is a function that pytest runs during test setup, not a function the test calls itself. Naming the fixture as a parameter of the test tells pytest to run the fixture function and supply its return value as that argument, so the test receives the dictionary, order["lines"] is an empty list, and the assertion passes. Option b is wrong because running a test once per value is what parametrisation does; a fixture supplies one value and the test runs once. Option c is wrong because pytest injects the fixture value before the test body runs, so order is bound and no NameError arises. Option d is wrong because the fixture decorator does not make order a test; pytest collects only functions whose names start with test_, so only one test is collected and run.

**Source anchor.** Python Automation Testing With Pytest - parameterize and setup and teardown (fixtures); Introduction to Testing in Python - fixtures (data preparation)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-09-b (single)

A test file contains the code below. How does pytest run `test_square`?

```python
import pytest

@pytest.mark.parametrize("value, expected", [(2, 4), (3, 9), (4, 16)])
def test_square(value, expected):
    assert value * value == expected
```

| | Option |
|---|---|
| **KEY** | As three separate tests, one per tuple, each reported with its own pass or fail result. |
|  | As one test that runs the assert three times and reports a single result. |
|  | As one test using only the first tuple; the remaining tuples are ignored. |
|  | It does not run, because value and expected are not defined as fixtures. |

**Rationale.** parametrize generates one test case per entry in the list, and pytest reports each separately, for example test_square[2-4], test_square[3-9] and test_square[4-16]. It is not a single test with a repeated assert: each case is an independent test with its own outcome, so one failing tuple does not hide the others. Every tuple is used, not only the first. The decorator itself supplies value and expected for each case, so no fixture is needed.

**Source anchor.** Python Automation Testing With Pytest - parameterize and setup and teardown (parametrised testing)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

### Slot 10 - Python testing

Blueprint: Comparing two datasets in Python - multi - what a comparison must handle.

Required depth: 2 items. Type: multi.

#### python-10-a (multi)

A test compares two extracts of customer rows, `source` and `target`, with the function below. Each extract is a list of dictionaries with the keys `id` and `amount`. The two extracts come from independent queries that give no guarantee of row order, and a row present in one extract can be absent from the other. The source `amount` is stored to two decimal places. The target `amount` is produced by floating point arithmetic during the load, so a correct target amount can differ from the source amount by a rounding error far smaller than 0.01.

```python
def find_mismatches(source, target):
    mismatches = []
    for source_row, target_row in zip(source, target):
        if source_row["amount"] != target_row["amount"]:
            mismatches.append(source_row["id"])
    return mismatches
```

Which of these changes must be made to the function for its result to be trustworthy?

| | Option |
|---|---|
| **KEY** | Pair each source row with the target row that has the same `id`, instead of pairing rows by their position in the lists. |
| **KEY** | Report every `id` that is present in one extract and absent from the other. |
| **KEY** | Compare amounts with an allowance for floating point rounding, such as a small tolerance or rounding both values to two decimal places, instead of by exact equality of the raw values. |
|  | Return as soon as the first mismatch is found. |
|  | Report a match without comparing any rows whenever the two extracts contain the same number of rows. |
|  | Compare the amounts as strings instead of as numbers. |

Key set: Pair each source row with the target row that has the same `id`, instead of pairing rows by their position in the lists. + Report every `id` that is present in one extract and absent from the other. + Compare amounts with an allowance for floating point rounding, such as a small tolerance or rounding both values to two decimal places, instead of by exact equality of the raw values.

**Rationale.** The function pairs rows with zip, so it compares by position, and the stem says the two queries give no guarantee of row order; rows must be paired by id, or a correctly loaded row is reported as a mismatch. Sorting both lists by id before zip is not enough, because a missing row shifts every later pairing. zip stops at the end of the shorter list and never checks ids, so a row present in only one extract is silently ignored; those ids must be reported, because missing rows are a primary defect the comparison exists to find. The target amount carries a floating point rounding error (for example 0.1 + 0.2 is 0.30000000000000004), so != on the raw values reports a mismatch for a correct amount; comparing within a small tolerance or after rounding both values to two decimal places removes those false mismatches, and either is acceptable, which is why the option names both. Returning at the first mismatch is not required and would hide every remaining difference. Equal row counts say nothing about which rows are present or about their values, so reporting a match on that basis is wrong. Comparing the amounts as strings does not remove the rounding difference (str(0.1 + 0.2) is '0.30000000000000004' while str(0.3) is '0.3') and hides type errors, so it is not a required change.

**Source anchor.** Introduction to Testing in Python - basic testing types (feature and integration tests over data)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

#### python-10-b (multi)

Two systems each return a list of dictionaries, one row per customer, with the keys `id` and `balance`. The systems give no guarantee of the same row order, and the team has agreed a tolerance for comparing balances. A test compares the two lists with the function below. Apart from what each situation describes, the two lists hold the same rows in the same order. In which of these situations does the function return `False`?

```python
def datasets_match(source, target):
    return source == target
```

| | Option |
|---|---|
| **KEY** | Both lists hold the same rows, but in a different order. |
| **KEY** | One customer's balance differs between the two lists only by a floating point rounding error smaller than the agreed tolerance. |
| **KEY** | The target list has one row fewer than the source list. |
|  | Each dictionary in the source list was built with `balance` before `id`, and each dictionary in the target list with `id` before `balance`. |
|  | One customer's balance is the integer `10` in the source list and the float `10.0` in the target list. |
|  | One customer's balance is `None` in both lists. |

Key set: Both lists hold the same rows, but in a different order. + One customer's balance differs between the two lists only by a floating point rounding error smaller than the agreed tolerance. + The target list has one row fewer than the source list.

**Rationale.** List equality with == requires the same length and compares elements position by position, and dictionary equality compares keys and values. The same rows in a different order put different dictionaries at the same positions, so the lists compare unequal and the function returns False. Two floating point values that differ by a rounding error are unequal under ==, so the dictionaries holding them are unequal and the function returns False; the agreed tolerance plays no part because the function never applies it. Lists of different length are never equal, so a missing row returns False. Dictionary equality ignores the order in which keys were inserted, so dictionaries built with the keys in a different order compare equal and the function returns True. The integer 10 and the float 10.0 compare equal in Python, so the function returns True. None compared with None by == is True, so a balance of None on both sides compares equal and the function returns True. A trustworthy comparison would match rows on id rather than position, report ids present on one side only, and compare balances within the tolerance, none of which a bare == provides.

**Source anchor.** Introduction to Testing in Python - basic testing types (feature and integration tests over data)

| Charter rule | Self-check |
|---|---|
| One defensible key | Pass |
| Type matches the slot | Pass |
| Option, element and token counts within the rules | Pass |
| No negative stem, no all/none of the above, no opinion stem | Pass |
| No "Select all that apply." in the stem (the interface adds it) | Pass |
| Rationale explains the key and the alternatives | Pass |
| Source anchor names a course topic | Pass |
| No organisation, product or person named | Pass |

