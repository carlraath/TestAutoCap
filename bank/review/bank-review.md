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

Before each monthly release, a billing team executes a fixed set of regression checks manually. That set has now been automated. The coming release changes the discount rules and adds two new discount bands, and the test plan for it lists four objectives. Which objective does a run of the automated set achieve on its own?

| | Option |
|---|---|
| **KEY** | The behaviour that the existing checks cover is confirmed at every release, in an identical way each time. |
|  | The written discount rules are reviewed against the charging policy to see that they say what was intended. |
|  | The new discount bands are explored for behaviour that the written requirements do not describe. |
|  | The parts of the release carrying the most business risk are identified so that effort can be directed at them. |

**Rationale.** Key a: an automated set of checks executes a predetermined comparison and reports whether it held. Running it delivers exactly one of the four objectives by itself: the behaviour the checks already cover is re-confirmed at every release, and confirmed the same way each time, free of the variation a person introduces when repeating the same steps manually. Consistent, repeatable re-execution of checks that already exist is what automating them buys, and it is the objective the run meets with no further human work. b is wrong because reading the written rules against the charging policy is a static review of a document: there is no running system for a check to exercise and no expected result for it to compare against, so the objective is met by people reading and discussing, whatever is automated elsewhere. c is wrong because exploring a feature for behaviour that no requirement describes is exploratory testing performed by a person: an automated check can only compare against the expected result it was given, and this set predates the discount bands entirely, so nothing in the run can meet this objective. Automation may free time for that exploration, but it does not perform it. d is wrong because judging which parts of a release carry the most business risk is an analysis people carry out before deciding what to test; the automated set executes the checks that such an analysis has already led the team to write, and a run of it produces no ranking of risk.

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

A warehouse team has automated a set of 40 stock-movement checks that it used to run by hand before every deployment. The checks and the expected figures behind them have stayed the same for two years, and the automated set now runs on each deployment. Which part of the team's testing work is still carried out by a person after this change?

| | Option |
|---|---|
| **KEY** | Deciding the correct stock figure for a movement type the set does not yet cover, and writing its check. |
|  | Comparing the stock figure each movement produces with the figure recorded in the check that covers it. |
|  | Repeating every check in the set after a fix, to establish that the other checks still pass. |
|  | Reporting, after each deployment, which of the checks passed and which of them failed. |

**Rationale.** Key a: automation takes over the execution of checks that already exist; it does not decide what should be checked or what the right answer is. Working out the correct stock figure for a movement type that no check covers, and then writing that check, is analysis and design carried out by a person, and it stays with a person however much of the existing set is automated. This is the boundary between automated and manual testing that the slot examines. b is wrong because comparing a produced figure with an expected figure is precisely the deterministic comparison an automated check performs on every run; a person fixed the expected figure once, when the check was written, but the repeated comparison is the machine's work. c is wrong because re-executing an unchanged set of checks after a fix is repetition, which is the strongest case for automation and is what the automated set now does on each deployment; the effort of that repetition is exactly what the team has removed from people. d is wrong because an automated run reports its own outcome, listing the checks that passed and the checks that failed; a person then decides what to do about a failure, but producing the list is part of the run and is no longer a manual task.

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

Arrange the automated test layers of the test automation pyramid by how fast one test typically runs, from fastest at the top of this list to slowest.

Elements as authored: e1 Unit tests, e2 API tests, e3 UI tests

Key sequence: 1. Unit tests  2. API tests  3. UI tests

**Rationale.** A unit test runs in memory against one unit with nothing deployed, so it is the fastest. An API test sends a request to a running service and waits for the response, so it takes longer. A UI test drives the whole stack through a rendered interface and waits for pages to load and settle, so it is the slowest. Every other order places a layer that exercises more of the running system above one that exercises less. Taking the five wrong orders in turn, fastest first: unit, UI, API places UI tests above API tests although a UI test drives the same service and the interface above it; API, unit, UI places API tests above unit tests although a unit test needs no service running at all; API, UI, unit makes unit tests the slowest of the three; UI, unit, API makes UI tests the fastest of the three; UI, API, unit is the fully reversed order, treating the slowest layer as the fastest.

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

An automation engineer runs a load test against a released order service to measure how its response times change as concurrent requests rise to 500, and reports the point at which the service slows down. In the agile testing quadrants, which quadrant does this activity belong to?

| | Option |
|---|---|
| **KEY** | Technology-facing tests that critique the product |
|  | Technology-facing tests that support the team |
|  | Business-facing tests that support the team |
|  | Business-facing tests that critique the product |

**Rationale.** Key a: performance and load testing sits in the technology-facing quadrant that critiques the product. It is technology-facing because it measures a technical property of the system, response time under concurrency, using a tool rather than a business rule, and it critiques the product because it evaluates a service that has already been built instead of guiding what to build. b is wrong because the technology-facing quadrant that supports the team holds unit and component tests written alongside the code to guide development; this measurement is taken after the service is released and changes no design decision as it is written. c is wrong because the business-facing quadrant that supports the team holds functional and story tests expressed in business terms and agreed before development; a concurrency measurement is not stated in business terms and does not define the intended behaviour of a feature. d is wrong because the business-facing quadrant that critiques the product holds exploratory, usability and acceptance activities that rely on human judgement of the product from a user's point of view, whereas this activity is a tool-driven measurement of a technical property.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 1 Introduction and objectives for test automation and Chapter 4 Implementing test automation: test types and levels, agile testing quadrants

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

Before development starts on a refund rule, the team agrees concrete examples of the refund amount expected in each case and automates those examples as checks the developers run while they build the rule. In the agile testing quadrants, which quadrant does this activity belong to?

| | Option |
|---|---|
|  | Technology-facing tests that critique the product |
|  | Technology-facing tests that support the team |
| **KEY** | Business-facing tests that support the team |
|  | Business-facing tests that critique the product |

**Rationale.** Key c: agreed examples of expected business outcomes, automated as functional checks, sit in the business-facing quadrant that supports the team. They are business-facing because each example is stated as a refund amount a business reader understands, and they support the team because they are agreed before development and guide the developers while the rule is built. a is wrong because the technology-facing quadrant that critiques the product holds performance, load and security measurements of a built system, none of which is happening here. b is wrong because the technology-facing quadrant that supports the team holds unit and component tests expressed against the code's internal structure; these checks are expressed as business outcomes and are agreed with the wider team rather than derived from the implementation. d is wrong because the business-facing quadrant that critiques the product holds exploratory, usability and acceptance activities carried out on a product that already exists, whereas these examples are written before the rule is developed and shape what is built.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 1 Introduction and objectives for test automation and Chapter 4 Implementing test automation: test types and levels, agile testing quadrants

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

A stock-movement import job gains a new movement type. The team writes tests for the new movement type. One of those tests finds a defect, and after the fix the team runs that test again. The team then runs the existing tests for the movement types the job already handled, to see that they still pass. Which classification fits that run of the existing tests?

| | Option |
|---|---|
| **KEY** | Regression testing |
|  | Progression testing |
|  | Confirmation testing |
|  | Smoke testing |

**Rationale.** Key a: regression testing re-runs existing tests against functionality that the change left alone, to see that a change elsewhere has broken nothing; the run of the existing tests for the movement types the job already handled is exactly that. b is wrong because progression testing is the testing of new functionality, which in this scenario is the set of tests written for the new movement type, not the existing tests. c is wrong because confirmation testing re-runs the specific test that failed, to see that its defect is now fixed; this scenario does contain such a re-run, but it is the second run of the one test that found the defect, and the existing tests for the other movement types never failed. d is wrong because smoke testing is a short, shallow check that a build's main functions work at all before deeper testing, whereas the run described is the full existing test set for the movement types the job already handled.

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

A reference-data service gains a currency-lookup endpoint. Before the suite runs, a short check confirms that the service starts and its main endpoints respond. The suite then runs the existing tests for the account-lookup and branch-lookup endpoints, which the release left unchanged. It also runs a set of tests written for the currency-lookup endpoint and running for the first time. Which classification fits that run of the new tests?

| | Option |
|---|---|
| **KEY** | Progression testing |
|  | Regression testing |
|  | Smoke testing |
|  | Confirmation testing |

**Rationale.** Key a: progression testing is the testing of new functionality, and the stem says these tests were written for the newly added currency-lookup endpoint and are running for the first time. b is wrong because regression testing re-runs existing tests against functionality that the change left alone; in this scenario that describes the run of the existing account-lookup and branch-lookup tests, which the release left unchanged. c is wrong because smoke testing is the short, shallow check that the service starts and its main endpoints respond, and the stem names that check as a separate step taken before the suite runs. d is wrong because confirmation testing re-runs a test that previously failed, to see that its defect is now fixed; the scenario contains no failed test and no defect fix, so nothing in it answers to that description.

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
| **KEY** | The same check is run again at every release. |
| **KEY** | The functionality it covers has been stable for a year. |
|  | Its result needs human visual judgement each run. |
|  | Its requirements change from one sprint to the next. |
| **KEY** | Its expected result is the same on every run. |

Key set: The same check is run again at every release. + The functionality it covers has been stable for a year. + Its expected result is the same on every run.

**Rationale.** Key a, b and e. a is right because a check repeated at every release gives the automated version many runs over which to repay the cost of writing it, which is the frequency factor. b is right because functionality that has been stable for a year is unlikely to force the script to be rewritten, so the maintenance cost stays low. e is right because an expected result that is the same on every run gives the script a fixed value to compare the actual result against, which is what makes an automated verdict trustworthy. c is wrong because a verdict that rests on a person looking at the result each run cannot be reduced to a comparison a script can make, so a person is still needed every time and the automation saves nothing. d is wrong because requirements that change from one sprint to the next mean the script is reworked as often as it is run, so the effort is never repaid.

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

Select all the properties of a nightly manual data check that strengthen its case for automation.

| | Option |
|---|---|
| **KEY** | The same steps repeat for two hundred region codes. |
| **KEY** | It takes an hour of repetitive comparison each night. |
|  | The layout of the file it reads changes without warning. |
| **KEY** | The data it checks can be queried directly by a script. |
|  | It will be run once only, before a one-off data migration. |

Key set: The same steps repeat for two hundred region codes. + It takes an hour of repetitive comparison each night. + The data it checks can be queried directly by a script.

**Rationale.** Key a, b and d. a is right because one set of steps applied to two hundred region codes is volume a script handles at almost no extra cost per code, while a person pays the full cost each time. b is right because an hour of repetitive comparison every night is a large recurring manual cost, and cost that recurs is exactly what automating removes. d is right because data a script can query directly means the check is technically feasible to automate and cheap to build, with no need to drive a screen. c is wrong because a file layout that changes without warning breaks the script repeatedly, so the maintenance cost rises with every change and weakens the case. e is wrong because a check run once only gives no repeat runs, so the effort of writing the automated version is never repaid.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 4 Implementing test automation: when to automate, automation candidacy factors; Chapter 2 Preparing for test automation: design for testability

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

A web shop team performs the four checks below by hand on every release and wants to automate them. Which check is the weakest candidate for automation?

| | Option |
|---|---|
| **KEY** | Confirming that the redesigned checkout page reads clearly to a shopper using it for the first time. |
|  | Confirming that the displayed order total equals the sum of the line totals for 500 baskets built from a fixed data set. |
|  | Confirming that an order whose card payment is declined is left in the awaiting-payment state. |
|  | Confirming that the stock export file holds one row for every item in the stock table. |

**Rationale.** The stem fixes all four checks at the same frequency, every release, so repetition cannot separate them and the only remaining question is whether a script can decide the result. Key a: whether a page reads clearly to a first-time shopper has no fixed expected result to compare against, so two reviewers can reach different conclusions about the same page and a script has nothing to assert; the check therefore stays with a person and is the weakest candidate. b is wrong because the expected total of each basket is computed from its own line totals, so every one of the 500 baskets has a definite expected result, and the volume is an argument for automating rather than against it. c is wrong because the awaiting-payment state is a definite recorded value that a script can read back and compare after driving a declined payment. d is wrong because the number of rows in an export file compared with the number of items in the stock table is a definite comparison with a single expected result.

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

A data warehouse team keeps a list of checks it could automate next. Each check below states how often it is performed. Which check is the weakest candidate for automation?

| | Option |
|---|---|
| **KEY** | Checking once, on the day the warehouse is first brought into service, that three retention periods match the approved settings list. |
|  | Checking after every nightly load that each row of the source extract has a matching row in the warehouse table. |
|  | Checking after every schema change that each warehouse column has the name and data type given in the agreed definition. |
|  | Checking after every nightly load that a record carrying a malformed date is written to the error table. |

**Rationale.** Every option states its own frequency and every option has a definite expected result, so frequency is what separates them. Key a: the check runs once, on one day, and compares three values against a list a person can read in a minute, so it will never run again and the effort of writing and maintaining a script is never repaid; a check that is executed once is the weakest candidate. b is wrong because a row-for-row comparison repeats after every nightly load and covers far more rows than a person could compare by hand, which makes it the strongest candidate on the list. c is wrong because column names and data types are compared against a fixed definition after every schema change, so the check recurs and its expected result is written down in advance. d is wrong because the routing of a malformed date to the error table is checked after every nightly load and has one definite expected outcome, so it is repeatable and deterministic.

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

One team has automated the same 100 regression checks four times over, once in each of the designs listed. With every release the application's screen layout changes and elements move to new positions on the same screens, while element identifiers and the API stay unchanged. Which of these suites needs the most maintenance effort per release?

| | Option |
|---|---|
| **KEY** | UI tests that find each screen element by its position on the screen. |
|  | UI tests that find each screen element by an identifier looked up in one shared list. |
|  | API tests that build each request in full inside the test that sends it. |
|  | API tests that send each request through one shared client library. |

**Rationale.** Key a: a test that finds elements by screen position is coupled to the layout, and the layout is the one part of the application that changes with every release. Each release moves the elements, those tests no longer find them, and every affected test has to be corrected, so this suite carries the highest maintenance effort per release. The principle is that maintenance cost follows how tightly a suite is coupled to the part of the system that changes most. b is wrong because these tests locate elements by identifier, the identifiers stay unchanged and the elements stay on the same screens, so a change of position leaves them working; even if an identifier did change later, the shared list would confine the edit to one place. c is wrong because these tests depend on the API, which stays unchanged, so a layout change has no effect on them; the duplicated request code would cost effort only if the API changed, and the stem says it does not. d is wrong because it too depends on the unchanged API, and it is the cheapest of the four to maintain, since any future API change would be handled once in the shared client library rather than in every test.

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

A team is choosing between two ways of automating the same regression checks. Proposal one takes 10 days to build and 2 days of maintenance per release. Proposal two takes 20 days to build and 1 day of maintenance per release. The checks run for 20 releases and are then retired. Which statement about the total effort over those 20 releases is correct?

| | Option |
|---|---|
| **KEY** | Proposal two costs 10 days less in total, because its lower maintenance is paid at every release. |
|  | Proposal one costs 10 days less in total, because its build takes half as long. |
|  | Proposal one costs less over these 20 releases, and proposal two would win only over a longer run. |
|  | The two cost the same in total, because proposal two's extra build effort equals the maintenance it saves. |

**Rationale.** Key a: proposal one costs 10 + (2 x 20) = 50 days and proposal two costs 20 + (1 x 20) = 40 days, so proposal two costs 10 days less over the period. The principle is that build effort is paid once while maintenance effort is paid at every release, so over a suite's life the maintenance rate decides the total and the cheaper build can be the dearer suite. b is wrong because the 10 days saved on the build are outweighed by the 20 extra days of maintenance that proposal one pays across 20 releases; comparing only the build costs is the error the item tests. c is wrong because proposal two is already the cheaper of the two within this period: the running totals cross at release 11, so no longer run is needed for it to win. d is wrong because the arithmetic does not balance; proposal two's extra build effort is 10 days while the maintenance it saves is 20 days, so the totals differ by 10 days.

**Source anchor.** ISTQB CTAL-TAE v2 (Udemy) - Chapter 4 Implementing test automation: maintainability; Chapter 8 Continuous improvement: maintenance and improving the solution

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
| **KEY** | The identifier of the build under test and the environment it ran in. |
| **KEY** | The log output captured when the test failed, including the response received. |
|  | The average duration of the suite over the last month. |
|  | The date the test was added to the suite and the sprint it was written in. |
|  | The total number of tests in the suite and the number of endpoints it covers. |

Key set: The expected value and the actual value at the step that failed. + The identifier of the build under test and the environment it ran in. + The log output captured when the test failed, including the response received.

**Rationale.** Key a, b and c: the expected and actual values show what went wrong, the identifier of the build under test and the environment it ran in show which version of the system failed and where it was running, and the log output with the response received shows the state at the moment of failure, which together let an investigator work from the record alone. d is wrong because an average duration is a trend metric about the suite as a whole with no bearing on why this test failed. e is wrong because when the test was written is history about the test's origin, not evidence about the failure. f is wrong because the size and coverage of the suite are static properties with no bearing on why this test failed.

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

An automated test applies a set of reconciliation rules to a table loaded overnight, and one rule reports a mismatch. Select all the details the failure record must hold for the mismatch to be traced to its cause without repeating the run.

| | Option |
|---|---|
| **KEY** | The identifier of the rule that reported the mismatch and the columns it compared. |
| **KEY** | The rows that failed, with the source value and the loaded value for each. |
| **KEY** | The environment the test ran in and the identifier of the load it examined. |
|  | Where the test's results are published and how often that display refreshes. |
|  | The escalation route the alert follows and the channel it is sent on. |
|  | The retention period set for the test's output and the format it is kept in. |

Key set: The identifier of the rule that reported the mismatch and the columns it compared. + The rows that failed, with the source value and the loaded value for each. + The environment the test ran in and the identifier of the load it examined.

**Rationale.** Key a, b and c. The stem says a set of rules was applied and one of them reported a mismatch, so a records which rule fired on this run and the columns it compared, without which the reported mismatch cannot be interpreted. b is the direct evidence of the mismatch itself, because a difference is only meaningful when both the source value and the loaded value are held side by side for each failing row. c names the environment and the identifier of the load that produced the table, which is what allows the investigator to trace the mismatch back from the values to the load that created them; without it the record shows a difference but gives no route to its cause. Each of the three is run-specific: it could have been different on the previous night. d is wrong because where results are published and how often that display refreshes is configuration about presenting results, identical on every run, and it tells the investigator nothing about the values that differed. e is wrong because alert routing and the channel used describe how a failure is announced rather than what the failing run found, and it is the same on every run. f is wrong because a retention period and storage format are a housekeeping policy for the output; they govern how long the record survives, not what the record shows about this mismatch.

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

Place each scenario onto the run trigger that fits it. Every trigger takes at least one scenario.

Buckets: On commit, Scheduled, Pre-release, On demand

Assignment:

- **On commit**: A unit suite that runs automatically whenever a change is merged into the shared branch.; An interface contract suite started by each new change arriving in the code repository.
- **Scheduled**: A data volume suite that starts at 02:00 every night on the test environment.
- **Pre-release**: A full regression pack run against the finished build as the final gate before production.
- **On demand**: A targeted rerun a tester starts by hand to reproduce a failure seen yesterday.

**Rationale.** The item doubles On commit, and the discrimination it tests is that two differently worded repository events are the same trigger class. t1 is On commit: the run starts when a change enters the shared branch and at no other time, so it is not Scheduled (no clock time is named), not Pre-release (no release point is named) and not On demand (nobody asks for it; it runs automatically). t5 is also On commit: it is started by each new change arriving in the repository, which is the same trigger class as t1 even though the wording differs; it is not Scheduled (no time), not Pre-release (no release point) and not On demand (the change starts it, not a person's request for a test run). t2 is Scheduled: it starts at a fixed clock time, 02:00 every night, whether or not anything has changed, so it is not On commit (no change event), not Pre-release (it runs nightly, not at a release point) and not On demand (nobody starts it). t3 is Pre-release: it runs against the finished build as the final gate before production, so its trigger is the approaching release; it is not On commit (a finished build, not a code change, prompts it), not Scheduled (no time is named) and not On demand (it is a fixed gate in the release path, not an ad hoc request). t4 is On demand: a person starts it by hand for one stated purpose, reproducing a failure, so it is not On commit (no change triggers it), not Scheduled (no time) and not Pre-release (no release is involved). The stem states that every trigger takes at least one scenario, which removes the only alternative assignment a participant could argue, namely leaving a bucket empty and placing two tokens elsewhere.

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

Place each scenario onto the run trigger that fits it. Every trigger takes at least one scenario.

Buckets: On commit, Scheduled, Pre-release, On demand

Assignment:

- **On commit**: A fast smoke suite that starts as soon as new code is checked in.
- **Scheduled**: An overnight reconciliation suite that runs at 01:00 whether or not anything has changed.; A performance suite that runs at 04:00 every Saturday against a copy of the database.
- **Pre-release**: An end-to-end suite run once against the version that is about to go live.
- **On demand**: A short data check a tester starts by hand to answer a question about the data.

**Rationale.** The item doubles Scheduled, and the discrimination it tests is that a nightly cadence and a weekly cadence are the same trigger class. t2 is Scheduled: it runs at 01:00 and the token states that it runs whether or not anything has changed, so it is not On commit (changes are explicitly irrelevant to it), not Pre-release (no release point is named) and not On demand (nobody starts it). t5 is also Scheduled: it runs at 04:00 every Saturday, a fixed clock time, so it sits with t2 despite the different cadence and the different suite; it is not On commit (no change event), not Pre-release (it runs weekly regardless of releases) and not On demand (it is not started by a person). t1 is On commit: the run starts as soon as new code is checked in, so its trigger is the change reaching the repository; it is not Scheduled (no time is named), not Pre-release (no release point) and not On demand (it starts on its own). t3 is Pre-release: it runs once against the version about to go live, so the approaching release is what prompts it; it is not On commit (no code change prompts it), not Scheduled (no time) and not On demand (it is a gate in the release path, not an ad hoc request). t4 is On demand: a person starts it by hand for one stated purpose, answering a question about the data, so it is not On commit (no change starts it), not Scheduled (no time) and not Pre-release (no release is involved). The stem states that every trigger takes at least one scenario, which removes the only alternative assignment a participant could argue, namely leaving a bucket empty and placing two tokens elsewhere.

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

An automated check on a reference table passes every time it is run on its own. Inside the nightly suite, which runs its checks one after another in a different order each night, the same check fails on some nights and passes on others. The team finds that several checks in the suite, including this one, create and delete rows in that same table. Which response fits this check?

| | Option |
|---|---|
| **KEY** | Give the check its own rows, created and removed by the check itself, so that other checks cannot affect its result. |
|  | Fix the order of the checks in the suite so that this check always runs in the same position each night. |
|  | Rerun the check on its own whenever the suite reports it as failed, and record the result of that separate run. |
|  | Add a wait at the start of the check so that the checks that run before it have time to finish. |

**Rationale.** Key a: a check whose result varies while the check and the system under test stay the same is flaky, that is non-deterministic. The stem supplies the evidence for the cause: the check is reliable alone, varies only inside a suite whose order changes each night, and shares one table with other checks, so its result depends on the rows those other checks happen to have left behind. Making the check create and remove the rows it needs removes that dependence, which is the response the flaky-test topic asks for: find the source of the non-determinism and remove it, so the check's result can be trusted again. b is wrong because pinning the run order does not remove the dependence on other checks, it only holds one arrangement of it steady: the check still relies on the state another check leaves, so it fails again as soon as a check is added, changed or removed, or the suite is run in parallel, and the shared-state cause remains in place. c is wrong because the check is already known to pass on its own, so a separate solo run answers a question nobody is asking and tells the team nothing about the suite run; recording that result reports a pass over an unresolved varying result, and any real fault that the interaction exposes is hidden with it. d is wrong because the suite runs its checks one after another, so the checks that run before this one have already finished when it starts; waiting longer cannot undo the rows they have left in the shared table, so the check would keep varying and the team would have spent run time for no gain.

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

An automated check compares the row count of a loaded table with the row count in the file the load reads from. On about one run in twenty the two counts differ and the check fails, and repeating the check straight away gives matching counts and a pass. The check, the file and the load job are unchanged throughout. Which action should the team take first?

| | Option |
|---|---|
| **KEY** | Compare the logs and timings recorded for the failing runs with those recorded for the passing runs, to find what differs. |
|  | Raise a defect against the load job describing the intermittent difference, and hand it to the team that owns the job. |
|  | Loosen the check so that a small difference between the two counts is recorded as a pass rather than a failure. |
|  | Measure how often the check has failed across its last two hundred runs, and report that failure rate to the team. |

**Rationale.** Key a: a check that returns different results for the same check, the same file and the same job is giving a non-deterministic, that is flaky, result, and the first step is to establish what actually differs between the runs that fail and the runs that pass. The runs themselves hold that evidence in what they recorded, so comparing the logs and timings of failing runs against passing runs is what turns a varying symptom into a known cause. It is also the step the other actions depend on: only that comparison shows whether the cause sits in the check, in its environment or in the load job. b is wrong because nothing observed so far shows where the cause lies; a non-deterministic result may come from the check, from the environment it runs in or from the job it exercises, and intermittent faults in each of those are possible. Handing a defect to another team before the failing and passing runs have been compared passes on a symptom without the evidence needed to act on it, and it stops the team investigating the parts they own. c is wrong because widening what counts as a match turns a reconciliation check into one that can no longer report the mismatch it exists to find; it removes the failure report rather than the cause, and a genuine shortfall in the load would then be recorded as a pass. d is wrong because a failure rate counts how often the symptom appears rather than showing what happens differently on the runs that fail; the team already knows it fails on roughly one run in twenty, so measuring that more precisely adds no information about the cause and leaves the investigation where it started.

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

The table `catalogue` holds these rows.

| id | code | category | price |
|---|---|---|---|
| 1 | C11 | fixings | 12 |
| 2 | C12 | fixings | 33 |
| 3 | C13 | fixings | 40 |
| 4 | C14 | fixings | 58 |
| 5 | C15 | tooling | 25 |

Which codes does `SELECT code FROM catalogue WHERE category = 'fixings' AND price < 40;` return?

| | Option |
|---|---|
| **KEY** | C11 and C12 |
|  | C11, C12 and C13 |
|  | C11, C12 and C15 |
|  | C13 and C14 |

**Rationale.** Both conditions must hold for a row to be returned. C11 at 12 and C12 at 33 are the only fixings rows priced below 40, so option a is correct. Option b treats `<` as `<=` and adds C13, which is priced at exactly 40 and so fails a strict less-than comparison. Option c drops the category condition and returns every row priced below 40, which pulls in the tooling row C15. Option d reverses the comparison and returns the fixings rows priced at 40 or above. Verified in PostgreSQL against the shown rows: the key query returns C11 and C12, and each distractor was reproduced by running the misread query it represents.

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

The table `shipments` holds these rows.

| id | region | units |
|---|---|---|
| 1 | R2 | 18 |
| 2 | R4 | 20 |
| 3 | R2 | 35 |
| 4 | R1 | 40 |
| 5 | R4 | 46 |

Which ids does `SELECT id FROM shipments WHERE units BETWEEN 20 AND 40;` return?

| | Option |
|---|---|
| **KEY** | 2, 3 and 4 |
|  | 3 |
|  | 2 and 3 |
|  | 1, 2, 3 and 4 |

**Rationale.** BETWEEN includes both endpoints, so the condition matches units of 20 up to and including 40. Rows 2 (20 units), 3 (35 units) and 4 (40 units) qualify, so option a is correct. Option b excludes both endpoints and keeps only row 3. Option c keeps the lower endpoint but excludes the upper one, dropping row 4 at exactly 40. Option d applies only the upper bound and returns every row at or below 40, which wrongly adds row 1 at 18 units. Verified in PostgreSQL against the shown rows: the key query returns ids 2, 3 and 4, and each distractor was reproduced by running the misread comparison it represents.

**Source anchor.** Intermediate SQL - data filtering: basic filtering

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

The tables `regions` and `sites` hold these rows.

| regions.code |
|---|
| N1 |
| N2 |
| N3 |
| N4 |

| sites.region_code |
|---|
| N2 |
| N2 |
| N4 |
| N8 |

How many rows does `SELECT * FROM regions INNER JOIN sites ON regions.code = sites.region_code` return?

| | Option |
|---|---|
|  | 2 |
| **KEY** | 3 |
|  | 4 |
|  | 5 |

Presented in the authored order (fixedOrder).

**Rationale.** An INNER JOIN returns one row per matching pair and keeps nothing else. Region N2 matches two site rows and region N4 matches one, giving 3 rows, so option b is correct. Regions N1 and N3 have no sites and the site row for N8 has no region, so none of them contributes a row. Option a counts the two regions that have any site, N2 and N4, and misses the second site row for N2. Option c is the row count of either table on its own, the answer of a candidate who assumes a join returns one row per region or one row per site. Option d is the LEFT JOIN count, which keeps the 3 matched rows and adds N1 and N3 with NULL site columns; this is the INNER against LEFT confusion the slot exists to detect. A full outer join would return 6 by also keeping the site row for N8. Counts verified by running the join, the LEFT JOIN and the full outer join against the shown rows in PostgreSQL.

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

How many rows does `SELECT * FROM employees LEFT JOIN tickets ON employees.id = tickets.employee_id` return?

| | Option |
|---|---|
|  | 3 |
|  | 4 |
| **KEY** | 5 |
|  | 6 |

Presented in the authored order (fixedOrder).

**Rationale.** A LEFT JOIN returns one row per matching pair and then keeps every left row that matched nothing. Employee 10 matches one ticket and employee 30 matches two, giving 3 matched rows, and employees 20 and 40 each appear once with NULL ticket columns, so the result is 5 rows and option c is correct. The ticket for employee 50 has no employee and is dropped because it sits on the right side. Option a is the INNER JOIN count, which drops the two unmatched employees. Option b counts one row per employee, which ignores the second ticket for employee 30. Option d also keeps the unmatched ticket for employee 50, which only a full outer join would do. Counts verified by running the LEFT JOIN, the INNER JOIN and the full outer join against the shown rows in PostgreSQL.

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

The tables `stock_moves` and `price_history` hold these rows.

| stock_moves.item_code |
|---|
| I1 |
| I1 |
| I2 |
| I3 |
| I9 |

| price_history.item_code |
|---|
| I1 |
| I2 |
| I2 |
| I4 |

How many rows does `SELECT * FROM stock_moves LEFT JOIN price_history ON stock_moves.item_code = price_history.item_code` return?

| | Option |
|---|---|
|  | 4 |
|  | 5 |
| **KEY** | 6 |
|  | 7 |

Presented in the authored order (fixedOrder).

**Rationale.** A LEFT JOIN pairs each left row with every matching right row, then keeps any left row that matched nothing. The two stock moves for I1 each match the single price row for I1, giving 2 rows. The single stock move for I2 matches both price rows for I2, giving 2 more. The stock moves for I3 and I9 match nothing and are kept once each with NULL price columns. That is 6 rows, so option c is correct. Option a is the INNER JOIN count of 4 matched rows, which drops I3 and I9. Option b is the number of stock move rows, the answer of a candidate who assumes a LEFT JOIN always returns one row per left row; that ignores the second price row for I2. Option d also keeps the unmatched price row for I4, which only a full outer join would do. Counts verified by running the LEFT JOIN, the INNER JOIN and the full outer join against the shown rows in PostgreSQL, and by inspecting the six returned rows.

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

The table `charges` holds these rows.

| id | account | amount |
|---|---|---|
| 1 | AC-10 | 40 |
| 2 | AC-20 | 35 |
| 3 | AC-10 | 60 |
| 4 | AC-30 | 30 |
| 5 | AC-20 | 20 |

Which rows does `SELECT account, SUM(amount) AS total FROM charges GROUP BY account HAVING SUM(amount) > 55;` return?

| | Option |
|---|---|
| **KEY** | AC-10 with a total of 100 |
|  | AC-10 with a total of 100, AC-20 with a total of 55 and AC-30 with a total of 30 |
|  | AC-10 with a total of 60 |
|  | AC-10 with a total of 100 and AC-20 with a total of 55 |

**Rationale.** GROUP BY produces one row per account with the summed amount: AC-10 is 40 + 60 = 100, AC-20 is 35 + 20 = 55 and AC-30 is 30. HAVING then filters those grouped rows, keeping only totals strictly above 55, so only AC-10 survives and option a is correct. Option b is the result of ignoring the HAVING clause and reporting every group. Option c is the result of filtering individual rows before grouping, as a WHERE clause would, which leaves only the single charge of 60 and sums that alone. Option d treats the strict > as >= and keeps AC-20, whose total is exactly 55 and therefore excluded. The query has no ORDER BY, so the options describe the set of rows returned rather than their order. Verified by executing the query and each misreading against the shown rows in PGlite: the key returns AC-10 with 100, ignoring HAVING returns all three groups, filtering rows first returns AC-10 with 60, and the inclusive threshold returns AC-10 with 100 and AC-20 with 55.

**Source anchor.** Intermediate SQL - data aggregation (summary values, one grouping column) and data filtering (complex filtering with HAVING)

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

The table `readings` holds these rows.

| id | meter_ref | value |
|---|---|---|
| 1 | M-01 | 30 |
| 2 | M-01 | 20 |
| 3 | M-02 | 45 |
| 4 | M-03 | 25 |
| 5 | M-03 | 10 |

Which rows does `SELECT meter_ref, COUNT(*) AS readings_taken FROM readings GROUP BY meter_ref HAVING SUM(value) > 40;` return?

| | Option |
|---|---|
| **KEY** | M-01 with a count of 2 and M-02 with a count of 1 |
|  | M-01 with a count of 2, M-02 with a count of 1 and M-03 with a count of 2 |
|  | M-02 with a count of 1 |
|  | M-01 with a count of 2 and M-03 with a count of 2 |

**Rationale.** The select list reports the number of rows in each group while the HAVING clause tests a different aggregate, the summed value. The group sums are M-01 30 + 20 = 50, M-02 45 and M-03 25 + 10 = 35, so HAVING SUM(value) > 40 keeps M-01 and M-02, and the counts reported for those two groups are 2 and 1, which makes option a correct. Option b is the result of ignoring the HAVING clause and reporting every group. Option c is the result of filtering individual rows before grouping, as a WHERE clause would, which leaves only the single reading of 45. Option d is the result of testing the counted rows rather than the summed value and keeping the groups holding more than one reading, which drops M-02 and admits M-03, whose sum of 35 is below the threshold. The query has no ORDER BY, so the options describe the set of rows returned rather than their order. Verified by executing the query and each misreading against the shown rows in PGlite: the key returns M-01 with 2 and M-02 with 1, ignoring HAVING returns all three groups, filtering rows first returns M-02 with 1, and testing the count returns M-01 with 2 and M-03 with 2.

**Source anchor.** Intermediate SQL - data aggregation (summary values, one grouping column) and data filtering (complex filtering with HAVING)

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

The table `parcels` holds these rows.

| id | ref | weight |
|---|---|---|
| 1 | P-11 | 4 |
| 2 | P-12 | 30 |
| 3 | P-13 | 8 |
| 4 | P-14 | 18 |
| 5 | P-15 | 5 |

What does `SELECT ref FROM parcels WHERE weight > (SELECT AVG(weight) FROM parcels);` return?

| | Option |
|---|---|
| **KEY** | P-12 and P-14 |
|  | P-12 |
|  | P-11, P-13 and P-15 |
|  | A single value, 13 |

**Rationale.** The inner subquery runs first and returns one value, the average weight: 65 divided by 5, which is 13. The outer query then returns the refs of the rows weighing more than 13, so the result is P-12 (30) and P-14 (18) and option a is correct. Option b returns only the heaviest parcel, which is what the query would give if the subquery used MAX rather than AVG. Option c lists the three parcels below the average, which is the result of reversing the comparison operator. Option d is the value the subquery itself produces, which feeds the comparison and is not what the outer SELECT returns. Verified in PostgreSQL: the subquery returns 13, the query returns P-12 and P-14, MAX returns P-12 alone, and the reversed comparison returns P-11, P-13 and P-15.

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

The table `machines` holds these rows.

| id | ref | line | site |
|---|---|---|---|
| 1 | M-01 | assembly | north |
| 2 | M-02 | packing | south |
| 3 | M-03 | assembly | south |
| 4 | M-04 | testing | east |
| 5 | M-05 | packing | north |

What does `SELECT ref FROM machines WHERE line IN (SELECT line FROM machines WHERE site = 'north');` return?

| | Option |
|---|---|
| **KEY** | M-01, M-02, M-03 and M-05 |
|  | M-01 and M-05 |
|  | assembly and packing |
|  | M-01 and M-03 |

**Rationale.** The inner subquery runs first and returns the lines that have a machine at the north site: assembly and packing. The outer query then returns every machine on either of those lines, whatever its own site, so the result is M-01, M-02, M-03 and M-05 and option a is correct. Option b returns only the machines at the north site, which is what the query would give if the site condition applied to the outer query instead of the subquery. Option c is the value list the subquery itself produces, which feeds the IN comparison and is not what the outer SELECT returns. Option d takes only the assembly line and misses the two packing machines. Verified in PostgreSQL: the subquery returns assembly and packing, the query returns M-01, M-02, M-03 and M-05, filtering on site returns M-01 and M-05, and filtering on the assembly line returns M-01 and M-03.

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

The table `incidents` holds these rows. NULL means no queue has been assigned.

| id | queue |
|---|---|
| 1 | Q1 |
| 2 | Q2 |
| 3 | NULL |
| 4 | NULL |
| 5 | Q3 |

What value does `SELECT COUNT(*) FROM incidents WHERE queue <> 'Q1';` return?

| | Option |
|---|---|
|  | 1 |
| **KEY** | 2 |
|  | 4 |
|  | 5 |

Presented in the authored order (fixedOrder).

**Rationale.** A comparison with NULL evaluates to unknown rather than true, and WHERE keeps only the rows whose condition is true, so the two rows with no queue are rejected. Only Q2 and Q3 compare as different from Q1, giving 2, so option b is correct. Option a is the count returned by the reversed condition queue = 'Q1'. Option c is what the query would return if the unassigned rows were treated as different from Q1, which is the result of IS DISTINCT FROM rather than <>. Option d counts every row in the table. Confirmed by loading the five shown rows into PGlite and running the query, which returned 2, with the three alternative readings returning 1, 4 and 5 respectively.

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

The table `readings` holds these rows. NULL means the reading was not recorded.

| id | value |
|---|---|
| 1 | 40 |
| 2 | NULL |
| 3 | 55 |
| 4 | NULL |
| 5 | 30 |

Which rows does `SELECT id FROM readings WHERE value = NULL;` return?

| | Option |
|---|---|
| **KEY** | No rows at all. |
|  | The rows with id 2 and id 4. |
|  | Every row in the table. |
|  | The database rejects the query and reports an error. |

**Rationale.** Equality against NULL evaluates to unknown for every row, including the rows where the reading is missing, and WHERE keeps only rows whose condition is true, so the query returns an empty result and option a is correct. Option b is the result of WHERE value IS NULL, which is the only test that matches missing values, and is what a candidate expects if they read = NULL as that test. Option c would require unknown to be treated as a match. Option d is wrong because comparing a column to NULL is a legal comparison that simply yields unknown, so the query runs and returns nothing. Confirmed by loading the five shown rows into PGlite: WHERE value = NULL returned no rows, WHERE value IS NULL returned ids 2 and 4, and the unfiltered select returned all five ids.

**Source anchor.** Intermediate SQL - data filtering: basic filtering

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

The table `depots` holds these rows.

| id | zone |
|---|---|
| 1 | Z2 |
| 2 | Z3 |
| 3 | Z2 |
| 4 | Z1 |
| 5 | Z3 |

Which values does `SELECT DISTINCT zone FROM depots ORDER BY zone DESC;` return, in the order returned?

| | Option |
|---|---|
| **KEY** | Z3, Z2, Z1 |
|  | Z1, Z2, Z3 |
|  | Z2, Z3, Z1 |
|  | Z3, Z3, Z2, Z2, Z1 |

**Rationale.** The five rows hold three separate zones, Z1, Z2 and Z3. DISTINCT reduces them to one row each and ORDER BY zone DESC returns them in descending order, so the result is Z3, Z2, Z1 and option a is correct. Option b applies DISTINCT but sorts ascending, ignoring DESC. Option c applies DISTINCT but leaves the values in the order they first appear in the table, ignoring the ORDER BY clause. Option d sorts descending but keeps every row, ignoring DISTINCT. Verified in PostgreSQL against the shown rows: the query returns Z3, Z2, Z1, the ascending form returns Z1, Z2, Z3, and the same query without DISTINCT returns Z3, Z3, Z2, Z2, Z1.

**Source anchor.** Intermediate SQL - data transformation: basic transformations (DISTINCT with ORDER BY)

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

The table `runs` holds these rows.

| id | suite | outcome |
|---|---|---|
| 1 | S1 | pass |
| 2 | S1 | pass |
| 3 | S2 | pass |
| 4 | S1 | fail |
| 5 | S2 | pass |

Which rows does `SELECT DISTINCT suite, outcome FROM runs ORDER BY suite ASC, outcome ASC;` return, in the order returned?

| | Option |
|---|---|
| **KEY** | (S1, fail), (S1, pass), (S2, pass) |
|  | (S1, pass), (S2, pass), (S1, fail) |
|  | (S1, fail), (S1, pass), (S1, pass), (S2, pass), (S2, pass) |
|  | (S1, pass), (S2, pass) |

**Rationale.** DISTINCT applies to the whole selected row, so the five rows reduce to the three separate pairs (S1, pass), (S2, pass) and (S1, fail). ORDER BY suite ASC, outcome ASC then sorts on suite first and on outcome within a suite, giving (S1, fail), (S1, pass), (S2, pass), so option a is correct. Option b holds the right three pairs but in the order they first appear in the table, ignoring the ORDER BY clause. Option c sorts correctly but keeps every row, ignoring DISTINCT. Option d treats DISTINCT as applying to suite alone and keeps the first outcome seen for each suite, so it loses the (S1, fail) row. Verified in PostgreSQL against the shown rows: the query returns (S1, fail), (S1, pass), (S2, pass), the same query without DISTINCT returns all five rows in that sort order, and deduplicating on suite alone returns only (S1, pass) and (S2, pass).

**Source anchor.** Intermediate SQL - data transformation: complex transformations (DISTINCT over several columns with ORDER BY)

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

Two systems each produce a list of the unit codes they hold for the same day. The tables `system_a` and `system_b` each hold a `unit_code` column.

| system_a.unit_code |
|---|
| UC-11 |
| UC-12 |
| UC-13 |
| UC-14 |

| system_b.unit_code |
|---|
| UC-12 |
| UC-14 |
| UC-15 |
| UC-16 |

Which query returns the unit codes held by both systems, giving UC-12 and UC-14?

| | Option |
|---|---|
| **KEY** | SELECT unit_code FROM system_a INTERSECT SELECT unit_code FROM system_b |
|  | SELECT unit_code FROM system_a EXCEPT SELECT unit_code FROM system_b |
|  | SELECT unit_code FROM system_b EXCEPT SELECT unit_code FROM system_a |
|  | SELECT unit_code FROM system_a UNION SELECT unit_code FROM system_b |

**Rationale.** INTERSECT keeps only the rows that appear in both result sets, which against the shown rows is UC-12 and UC-14, so option a is correct. Option b returns the codes held by the first system alone, UC-11 and UC-13. Option c returns the codes held by the second system alone, UC-15 and UC-16. Option d returns every code from either system, all six. Options a, b and c each return two rows, so the candidate has to read which two codes are returned rather than count rows. Every option was run in PostgreSQL against the shown rows and only option a returns UC-12 and UC-14.

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

A reconciliation report needs one combined list of the branch codes covered by two extracts. The tables `extract_1` and `extract_2` each hold a `branch_code` column.

| extract_1.branch_code |
|---|
| BR-01 |
| BR-02 |
| BR-03 |

| extract_2.branch_code |
|---|
| BR-02 |
| BR-03 |
| BR-04 |
| BR-05 |

Which query returns the branch codes covered by either extract with each code appearing once, giving the five rows BR-01, BR-02, BR-03, BR-04 and BR-05?

| | Option |
|---|---|
| **KEY** | SELECT branch_code FROM extract_1 UNION SELECT branch_code FROM extract_2 |
|  | SELECT branch_code FROM extract_1 UNION ALL SELECT branch_code FROM extract_2 |
|  | SELECT branch_code FROM extract_1 INTERSECT SELECT branch_code FROM extract_2 |
|  | SELECT branch_code FROM extract_1 EXCEPT SELECT branch_code FROM extract_2 |

**Rationale.** UNION stacks the two result sets and removes duplicate rows, so it returns the five distinct codes once each and option a is correct. Option b keeps duplicates, so BR-02 and BR-03 appear twice and seven rows come back, which fails the requirement that each code appears once. Option c returns only the codes covered by both extracts, BR-02 and BR-03. Option d returns the codes covered by the first extract alone, BR-01. Every option was run in PostgreSQL against the shown rows and only option a returns the five codes once each.

**Source anchor.** Joining Data in SQL - combining data vertically, stacking rows with UNION; SQL for Testers - validating data integrity

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

A load copies records from `upstream` into `downstream`, which should hold only records that came from `upstream`. Each table holds a `record_id` column.

| upstream.record_id |
|---|
| 7001 |
| 7002 |
| 7003 |
| 7004 |
| 7005 |

| downstream.record_id |
|---|
| 7002 |
| 7004 |
| 7007 |
| 7008 |

Which query returns the record ids present in `downstream` but absent from `upstream`, giving 7007 and 7008?

| | Option |
|---|---|
| **KEY** | SELECT record_id FROM downstream EXCEPT SELECT record_id FROM upstream |
|  | SELECT record_id FROM upstream EXCEPT SELECT record_id FROM downstream |
|  | SELECT record_id FROM upstream INTERSECT SELECT record_id FROM downstream |
|  | SELECT record_id FROM upstream UNION SELECT record_id FROM downstream |

**Rationale.** EXCEPT returns the rows of the left result set that do not appear in the right one, so putting downstream on the left returns 7007 and 7008 and option a is correct. Option b reverses the operands and returns the ids that reached upstream but never arrived downstream, 7001, 7003 and 7005, which is the opposite gap. Option c returns the ids common to both tables, 7002 and 7004. Option d returns every id from either table, seven rows. Every option was run in PostgreSQL against the shown rows and only option a returns 7007 and 7008.

**Source anchor.** SQL for Testers - validating data integrity with set operations (EXCEPT)

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

A submission job copies reference codes from `submitted` into `accepted`. After the run the tables hold these codes.

| submitted.ref_code |
|---|
| R-11 |
| R-12 |
| R-13 |
| R-14 |

| accepted.ref_code |
|---|
| R-11 |
| R-13 |
| R-20 |

Which query returns the codes present in submitted but absent from accepted, giving R-12 and R-14?

| | Option |
|---|---|
| **KEY** | SELECT ref_code FROM submitted EXCEPT SELECT ref_code FROM accepted |
|  | SELECT ref_code FROM accepted EXCEPT SELECT ref_code FROM submitted |
|  | SELECT ref_code FROM submitted INTERSECT SELECT ref_code FROM accepted |
|  | SELECT s.ref_code FROM submitted s LEFT JOIN accepted a ON s.ref_code = a.ref_code |

**Rationale.** EXCEPT returns the rows of the left query that do not appear in the right query, so reading submitted first and accepted second isolates the codes that never arrived, R-12 and R-14, and option a is correct. Option b reverses the two sides and finds the opposite gap, the code held by accepted with no counterpart in submitted, returning R-20. Option c returns the codes held by both tables, R-11 and R-13, which are the ones that did arrive. Option d keeps every submitted row whether or not it matched, because a LEFT JOIN without a filter on the right-hand column returns all four codes R-11 to R-14. Each of the four queries was run in PGlite against the shown rows and only option a returns R-12 and R-14.

**Source anchor.** SQL for Testers - validating data integrity: finding rows missing from a target (EXCEPT); Joining Data in SQL - set operations

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

A load job copies order rows from `expected` into `loaded`. After the run the tables hold these ids.

| expected.id |
|---|
| 501 |
| 502 |
| 503 |
| 504 |
| 505 |

| loaded.id |
|---|
| 501 |
| 503 |
| 505 |
| 507 |

Which query returns the ids present in expected but absent from loaded, giving 502 and 504?

| | Option |
|---|---|
| **KEY** | SELECT e.id FROM expected e LEFT JOIN loaded l ON e.id = l.id WHERE l.id IS NULL |
|  | SELECT e.id FROM expected e LEFT JOIN loaded l ON e.id = l.id WHERE l.id IS NOT NULL |
|  | SELECT e.id FROM expected e INNER JOIN loaded l ON e.id = l.id WHERE l.id IS NULL |
|  | SELECT l.id FROM loaded l LEFT JOIN expected e ON l.id = e.id WHERE e.id IS NULL |

**Rationale.** A LEFT JOIN keeps every row of the left table and fills the right-hand columns with NULL where no match exists, so keeping the rows whose l.id is NULL isolates the expected ids that never arrived, 502 and 504, and option a is correct. Option b keeps the rows that did find a partner and returns 501, 503 and 505, the opposite of the goal. Option c looks similar but uses an INNER JOIN, which drops unmatched rows before the filter runs and so can never produce a NULL on the right; it returns no rows at all. Option d reads from the other side and finds the loaded id with no counterpart in expected, returning 507. Each of the four queries was run in PGlite against the shown rows and only option a returns 502 and 504.

**Source anchor.** SQL for Testers - validating data integrity: finding rows missing from a target (LEFT JOIN with IS NULL); Joining Data in SQL - combining data horizontally: keeping all rows with LEFT JOIN

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

A release job publishes product codes from `staging` into `live`. After the run the tables hold these codes. Neither code column holds a NULL value.

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
| A9 |

Which query returns the codes present in staging but absent from live, giving A2 and A3?

| | Option |
|---|---|
| **KEY** | SELECT code FROM staging WHERE code NOT IN (SELECT code FROM live) |
|  | SELECT code FROM staging WHERE code IN (SELECT code FROM live) |
|  | SELECT code FROM live WHERE code NOT IN (SELECT code FROM staging) |
|  | SELECT code FROM staging UNION SELECT code FROM live |

**Rationale.** The subquery lists the codes that reached live, and the outer filter keeps the staging codes that are missing from that list, A2 and A3, so option a is correct. The stem rules out NULL codes, which is what makes this form safe. Option b keeps the staging codes that did reach live and returns A1 and A4, the opposite of the goal. Option c swaps the two tables and finds the code held by live with no counterpart in staging, returning A9. Option d combines both tables and returns all five distinct codes A1, A2, A3, A4 and A9, so it reports far more than the gap. Each of the four queries was run in PGlite against the shown rows and only option a returns A2 and A3.

**Source anchor.** SQL for Testers - validating data integrity: finding rows missing from a target (subquery filter); Joining Data in SQL - subqueries

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

A nightly extract copies part quantities from `source` into `target`. Both tables hold the same four part codes, and every row has a quantity.

| source.part_code | source.quantity |
|---|---|
| P-11 | 40 |
| P-12 | 65 |
| P-13 | 12 |
| P-14 | 90 |

| target.part_code | target.quantity |
|---|---|
| P-11 | 40 |
| P-12 | 55 |
| P-13 | 12 |
| P-14 | 25 |

Which query returns the part codes whose quantity differs between the two tables, giving P-12 and P-14?

| | Option |
|---|---|
| **KEY** | SELECT s.part_code FROM source s INNER JOIN target t ON s.part_code = t.part_code WHERE s.quantity <> t.quantity |
|  | SELECT s.part_code FROM source s INNER JOIN target t ON s.part_code = t.part_code WHERE s.quantity = t.quantity |
|  | SELECT s.part_code FROM source s INNER JOIN target t ON s.part_code = t.part_code |
|  | SELECT s.part_code FROM source s LEFT JOIN target t ON s.part_code = t.part_code WHERE t.part_code IS NULL |

**Rationale.** Joining on the key pairs each source row with the target row that carries the same part code, and the filter then keeps only the pairs whose quantities disagree, which is P-12 (65 against 55) and P-14 (90 against 25), so option a is correct. Option b keeps the pairs whose quantities agree and returns P-11 and P-13, the rows that did not change. Option c joins correctly but compares nothing, so it returns all four part codes. Option d is the pattern for finding rows missing from the target rather than rows whose value changed, and because both tables hold the same four part codes it returns no rows at all. All four queries were executed in PGlite against the rows shown: option a returned P-12 and P-14, option b returned P-11 and P-13, option c returned all four codes and option d returned nothing.

**Source anchor.** SQL for Testers - validating data integrity: detecting changed values between source and target (join on the key and compare one column)

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

A reconciliation compares a daily `feed` against the `master` record for four sites. Both tables hold the same four site codes, and every row has a region and a stage.

| feed.site_code | feed.region | feed.stage |
|---|---|---|
| S-301 | North | active |
| S-302 | North | active |
| S-303 | South | closed |
| S-304 | East | active |

| master.site_code | master.region | master.stage |
|---|---|---|
| S-301 | North | active |
| S-302 | West | active |
| S-303 | South | active |
| S-304 | East | active |

Which query returns the site codes whose region or stage differs between the two tables, giving S-302 and S-303?

| | Option |
|---|---|
| **KEY** | SELECT f.site_code FROM feed f INNER JOIN master m ON f.site_code = m.site_code WHERE f.region <> m.region OR f.stage <> m.stage |
|  | SELECT f.site_code FROM feed f INNER JOIN master m ON f.site_code = m.site_code WHERE f.region <> m.region AND f.stage <> m.stage |
|  | SELECT f.site_code FROM feed f INNER JOIN master m ON f.site_code = m.site_code WHERE f.region <> m.region |
|  | SELECT f.site_code FROM feed f INNER JOIN master m ON f.site_code = m.site_code WHERE f.region = m.region AND f.stage = m.stage |

**Rationale.** Joining on the site code pairs each feed row with its master row, and OR keeps a pair when either compared column disagrees, which is S-302 (region North against West) and S-303 (stage closed against active), so option a is correct. No site differs in both columns at once, so an inclusive or an exclusive reading of "or" in the stem names the same two site codes. Option b requires both columns to disagree in the same row and returns nothing, because each changed site changed in only one column. Option c compares the region alone and misses the site whose stage changed, returning S-302 only. Option d keeps the pairs where both columns agree and returns S-301 and S-304, the sites that did not change. All four queries were executed in PGlite against the rows shown: option a returned S-302 and S-303, option b returned nothing, option c returned S-302 and option d returned S-301 and S-304.

**Source anchor.** SQL for Testers - validating data integrity: detecting changed values between source and target (join on the key and compare several columns)

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

An automated test inserted the two rows with ids 9001 and 9002 into `bookings`. The other three rows are permanent reference data that must remain. The table now holds these rows.

| id | ref | region |
|---|---|---|
| 4001 | REF-4001 | North |
| 4002 | REF-4002 | South |
| 4003 | REF-4003 | North |
| 9001 | TMP-4001 | North |
| 9002 | TMP-4002 | South |

Which statements remove exactly the two inserted rows and leave the other three rows in place, when each statement is run on its own against the table shown?

| | Option |
|---|---|
| **KEY** | DELETE FROM bookings WHERE ref IN ('TMP-4001', 'TMP-4002'); |
| **KEY** | DELETE FROM bookings WHERE ref LIKE 'TMP-%'; |
| **KEY** | DELETE FROM bookings WHERE id >= 9001; |
|  | DELETE FROM bookings WHERE region = 'North'; |
|  | DELETE FROM bookings WHERE id > 9000 AND region = 'South'; |
|  | DELETE FROM bookings WHERE ref LIKE '%4001%'; |

Key set: DELETE FROM bookings WHERE ref IN ('TMP-4001', 'TMP-4002'); + DELETE FROM bookings WHERE ref LIKE 'TMP-%'; + DELETE FROM bookings WHERE id >= 9001;

**Rationale.** Clean-up must remove the rows the test created and nothing else, so each statement is judged by the rows it leaves behind. Option a names the two inserted references, so it removes 9001 and 9002 only. Option b matches references that begin with TMP-, and among the shown rows only the two inserted references begin with that text; the three permanent references begin with REF-. Option c matches ids of 9001 and above, and among the shown rows only the two inserted rows sit in that range, the permanent ids being 4001, 4002 and 4003. All three leave 4001, 4002 and 4003 in place. Option d deletes by region: it removes the permanent rows 4001 and 4003 and leaves the inserted row 9002 behind. Option e adds a region condition to the id range, so it removes 9002 only and leaves 9001 behind. Option f matches references containing 4001 anywhere, so it removes the permanent row 4001 as well as 9001 and leaves 9002 behind. Each statement was executed in turn against the shown rows and the remaining ids were checked: options a, b and c each left exactly 4001, 4002 and 4003; option d left 4002 and 9002; option e left 4001, 4002, 4003 and 9001; option f left 4002, 4003 and 9002.

**Source anchor.** SQL for Testers - using SQL for data generation: delete data

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

An automated test creates its own rows in `accounts`. The table was created and populated by this script.

```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  balance INTEGER
);
INSERT INTO accounts (id, ref, region, balance) VALUES (1, 'ACC-001', 'North', 120);
INSERT INTO accounts (id, ref, region, balance) VALUES (2, 'ACC-002', 'South', 40);
```

Which of these statements succeed and add a row, when each statement is run on its own against the table as the script leaves it?

| | Option |
|---|---|
| **KEY** | INSERT INTO accounts (id, ref, region, balance) VALUES (9001, 'TEST-A', 'North', 0); |
|  | INSERT INTO accounts (id, ref, region, balance) VALUES (1, 'TEST-B', 'North', 50); |
|  | INSERT INTO accounts (id, ref, region, balance) VALUES (9002, 'ACC-001', 'South', 50); |
| **KEY** | INSERT INTO accounts (id, ref, region) VALUES (9003, 'TEST-C', 'North'); |
|  | INSERT INTO accounts (id, ref, balance) VALUES (9004, 'TEST-D', 75); |
| **KEY** | INSERT INTO accounts (id, region, ref, balance) VALUES (9005, 'South', 'TEST-E', 90); |

Key set: INSERT INTO accounts (id, ref, region, balance) VALUES (9001, 'TEST-A', 'North', 0); + INSERT INTO accounts (id, ref, region) VALUES (9003, 'TEST-C', 'North'); + INSERT INTO accounts (id, region, ref, balance) VALUES (9005, 'South', 'TEST-E', 90);

**Rationale.** A test row is only added if it satisfies every constraint the shown script declares. Option a supplies an unused id, an unused reference and a value for every column, so the row is added. Option d omits balance, which the script declares as plain INTEGER with no NOT NULL, so the row is added with balance left empty. Option f lists the columns in a different order from the script and supplies a matching value for each, which is valid, so the row is added. Option b reuses id 1, which the primary key already holds, so the insert is rejected. Option c reuses the reference ACC-001, which the UNIQUE constraint on ref already holds, so the insert is rejected. Option e omits region, which the script declares NOT NULL with no default, so the insert is rejected. Each statement was executed on its own against the table as the script leaves it: a, d and f each added a row, and b, c and e were each rejected by the primary key, the unique constraint on ref and the not-null constraint on region respectively.

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
threshold = 0
label = ""
offset = -1
if threshold:
    print("threshold")
elif label:
    print("label")
elif offset:
    print("offset")
else:
    print("fallback")
```

| | Option |
|---|---|
|  | threshold |
|  | label |
| **KEY** | offset |
|  | fallback |

**Rationale.** The chain runs the first branch whose value is truthy. threshold holds the integer 0, which is falsy, so that branch is skipped. label holds the empty string, which is falsy, so that branch is skipped. offset holds -1, and every non-zero number is truthy, so the third branch runs and the code prints offset. threshold assumes the integer 0 is truthy; 0 is the only falsy integer. label assumes the empty string is truthy; a string is truthy only when it holds at least one character. fallback assumes a negative number is falsy, so that no branch runs and the else clause fires; truthiness for numbers depends on being non-zero, not on being positive, so -1 is truthy.

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
def capped(value, limit):
    result = min(value, limit)

print(capped(90, 60))
```

| | Option |
|---|---|
| **KEY** | None |
|  | 60 |
|  | 90 |
|  | An error, because there is no return statement |

**Rationale.** The function assigns result but has no return statement, so the call evaluates to None and print shows None. 60 assumes the computed local value is handed back to the caller: min(90, 60) is indeed 60, but without a return statement that value stays inside the function and the caller receives None. 90 assumes a value is handed back and reads min as choosing the larger of its two arguments; min returns the smaller, and in any case nothing is returned. An error is not raised: calling a function that has no return statement is ordinary Python, and the resulting None prints as None.

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
line = "  order:1042  "
trimmed = line.strip()
position = trimmed.find(":")
print(trimmed[:position], position, len(trimmed))
```

| | Option |
|---|---|
| **KEY** | order 5 10 |
|  | order 6 10 |
|  | order: 5 10 |
|  | order 5 14 |

**Rationale.** strip removes the leading and trailing spaces, so trimmed is "order:1042", which has 10 characters. find returns the index of the first match, and indexes start at 0, so the colon at the sixth character has index 5. A slice runs up to but not including its end index, so trimmed[:5] takes indexes 0 to 4 and gives "order". The printed line is therefore "order 5 10". "order 6 10" counts the colon as the sixth character and reports 6; find reports an index counted from 0, not a position counted from 1. "order: 5 10" includes the colon in the slice; trimmed[:5] stops before index 5, so the colon is excluded. "order 5 14" reports the length of line rather than trimmed; strip returns a new string with the four surrounding spaces removed, and len is applied to that new string.

**Source anchor.** Programming for Everybody - strings (slicing, indexing from zero, methods such as strip and find)

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

A test run records how long each check took, in seconds, and reports the shortest. What does this code print?

```python
seconds = [12, 5, 9]
shortest = 0
for value in seconds:
    if value < shortest:
        shortest = value
print("shortest", shortest)
```

| | Option |
|---|---|
| **KEY** | shortest 0 |
|  | shortest 5 |
|  | shortest 12 |
|  | shortest 9 |

**Rationale.** shortest is set to 0 before the loop, so each comparison asks whether the value is less than 0. 12, 5 and 9 are all greater than 0, so the if body never runs, shortest keeps its starting value and print outputs the label followed by 0. "shortest 5" assumes the loop finds the smallest value in the list; it would do so only if shortest started at the first value or at a number larger than every value. "shortest 12" assumes shortest is seeded from the first element; the line above the loop sets it to 0. "shortest 9" assumes the last value examined is assigned; assignment happens only inside the if, and that condition is false for every value.

**Source anchor.** Programming for Everybody - loops and iteration (finding maximum and minimum) with lists and conditional code (reading a short program end to end)

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

    def check_stock(self):
        assert True

class CartHelpers:
    def test_reset(self):
        assert True

def test_empty_cart():
    assert True

def build_cart():
    assert True
```

| | Option |
|---|---|
| **KEY** | TestCart.test_add_item |
|  | TestCart.check_stock |
|  | CartHelpers.test_reset |
| **KEY** | test_empty_cart |
|  | build_cart |

Key set: TestCart.test_add_item + test_empty_cart

**Rationale.** With default settings pytest collects module-level functions whose names begin with the lowercase prefix test (conventionally written test_), and it collects methods carrying that same prefix only when they sit inside a class whose own name begins with Test. test_add_item carries the prefix and sits inside TestCart, and test_empty_cart carries the prefix at module level, so both are collected. check_stock does not begin with the prefix, so it stays an ordinary helper method even though it contains an assert. test_reset does begin with the prefix, but its class is named CartHelpers, which does not begin with Test, so pytest never looks inside that class and the method is not collected. build_cart does not begin with the prefix, so it is an ordinary helper function. Verified by running pytest --collect-only against exactly this file: only test_cart.py::TestCart::test_add_item and test_cart.py::test_empty_cart were collected.

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

A test file contains the code below. What happens when pytest runs `test_get_order`?

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
| **KEY** | The test fails at `assert order["status"] == "Delivered"`, and the second assert is never evaluated. |
|  | The test fails, and pytest reports both asserts in the function as failed. |
|  | The test passes, because `get_order` returns a value without raising an exception. |
|  | The test fails at `assert order["items"] == 3`, because both asserts are evaluated and pytest reports the last failure. |

**Rationale.** order["status"] is "Shipped", so the comparison in the first assert is False and that assert raises AssertionError. The exception ends test_get_order at that point, so the second assert is never evaluated, and pytest reports one failure showing 'Shipped' == 'Delivered'. Option b is wrong because a failed assert stops the function rather than continuing to collect further failures, so pytest can only ever report the first assert that fails. Option c is wrong because a test passes only when every assert it reaches holds; get_order returning normally does not save the test, since it is the assert statement itself that raises the exception. Option d is wrong for the same reason as b, and additionally because the second assert never runs at all, so its condition is never compared and it cannot be what pytest reports.

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

A test file contains the code below. What happens when pytest runs `test_order_total_rejects_empty`?

```python
import pytest

def order_total(lines):
    total = 0
    for line in lines:
        total += line["amount"]
    return total

def test_order_total_rejects_empty():
    with pytest.raises(ValueError):
        order_total([])
```

| | Option |
|---|---|
| **KEY** | The test fails, because the block finished without raising `ValueError` and `pytest.raises` requires that exception to be raised. |
|  | The test passes, because `order_total` returned a value instead of raising an exception. |
|  | The test passes, because the function contains no `assert` statement, so there is nothing in it that can fail. |
|  | The test is reported as an expected failure, because `pytest.raises` marks the block it wraps as expected to fail. |

**Rationale.** order_total([]) runs the loop zero times and returns 0, so no exception is raised inside the with block. pytest.raises asserts that the wrapped block raises the named exception, so when the block completes normally pytest fails the test and reports 'DID NOT RAISE <class \'ValueError\'>'. Option b inverts the meaning of pytest.raises: returning a value is exactly the outcome that makes the test fail, not pass. Option c is wrong because pytest.raises is itself an assertion about the block, so a test can fail without containing an assert statement; the absence of assert does not make the test safe. Option d confuses pytest.raises with the xfail marker: pytest.raises checks that a specific exception occurs within a block and fails the test when it does not, whereas marking a test as expected to fail is a separate decorator applied to the test function.

**Source anchor.** Introduction to Testing in Python - creating tests with pytest (pytest.raises); Python Automation Testing With Pytest - assertions and test discovery

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
| **KEY** | pytest runs the order fixture function first and passes its returned dictionary in as the order argument, so the assertion holds and the test passes. |
|  | pytest repeats the test once for each key in the dictionary that the fixture returns, so two results are reported for the one test function. |
|  | pytest reports an error for the test, because nothing supplies a value for the order argument when the test function is called. |
|  | pytest collects the decorated order function as a test as well, so two test results are reported rather than one. |

**Rationale.** Key is a. A fixture is a setup function that pytest runs on the test's behalf. Naming the fixture as a parameter of the test requests it, so pytest runs order(), injects the returned dictionary as the order argument, and the test body then evaluates order["lines"] == [], which holds, so the single test passes. Verified by running the shown file under pytest: one test collected, one passed. Option b is wrong because repeating a test once per value is what parametrisation does; a fixture supplies one value for one run, and the shown run collected a single test, not two. Option c is wrong because the request is satisfied: the fixture is defined in the same file, so pytest has a value for the argument and no error is raised; that outcome belongs to a test that requests a fixture that does not exist. Option d is wrong because the fixture decorator does not make order a test and pytest collects only functions whose names begin with test_, so only one test was collected from the file.

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

A test file contains the code below. What does pytest report when it runs `test_square`?

```python
import pytest

@pytest.mark.parametrize("value, expected", [(2, 4), (3, 9), (4, 15)])
def test_square(value, expected):
    assert value * value == expected
```

| | Option |
|---|---|
| **KEY** | Three results, one for each tuple: the cases for 2 and for 3 pass, and the case for 4 fails on its assertion. |
|  | One result, a failure, because the three tuples are checked inside a single test that stops at the first assertion that does not hold. |
|  | One result, a pass, because pytest uses only the first tuple in the list and ignores the two tuples that follow it. |
|  | An error at collection time and no test results, because value and expected are not defined anywhere as fixtures for the test. |

**Rationale.** Key is a. parametrize generates one independent test case per entry in the list, and each case is reported with its own outcome, named after its arguments. Here 2 * 2 == 4 and 3 * 3 == 9 hold, while 4 * 4 is 16 and not 15, so that case fails. Verified by running the shown file under pytest: three cases were collected and reported, test_square[2-4] and test_square[3-9] passed and test_square[4-15] failed, giving 1 failed, 3 passed across the run. Option b is wrong because the cases are separate tests rather than three assertions inside one test, so a failing case does not hide or stop the others; the run reported three results, not one. Option c is wrong because every entry in the list is used, not only the first, which is the whole point of listing them. Option d is wrong because the decorator itself supplies value and expected for each case, so no fixture of those names is needed and collection succeeds.

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

A test compares two extracts of customer rows, `source` and `target`, with the function below. Each extract is a list of dictionaries with the keys `id` and `amount`. The extracts come from independent queries, so the row order can differ between them and a row present in one extract can be absent from the other. The source `amount` is stored to two decimal places, while the target `amount` is produced by floating point arithmetic during the load, so a correct target amount can differ from the source amount by a rounding error far smaller than 0.01.

```python
def find_mismatches(source, target):
    mismatches = []
    for source_row, target_row in zip(source, target):
        if source_row["amount"] != target_row["amount"]:
            mismatches.append(source_row["id"])
    return mismatches
```

Which changes must be made to this function for its result to be trustworthy?

| | Option |
|---|---|
| **KEY** | Pair each source row with the target row that carries the same `id`, instead of pairing rows by list position. |
| **KEY** | Report every `id` that is present in one extract and absent from the other extract. |
| **KEY** | Allow for floating point rounding when comparing amounts, instead of requiring the two raw values to be equal. |
|  | Return the list of mismatches as soon as the first differing amount is found. |
|  | Sort both extracts by `amount` before the loop, and keep pairing the rows by list position. |
|  | Convert the two `amount` values to strings and compare the strings instead of the numbers. |

Key set: Pair each source row with the target row that carries the same `id`, instead of pairing rows by list position. + Report every `id` that is present in one extract and absent from the other extract. + Allow for floating point rounding when comparing amounts, instead of requiring the two raw values to be equal.

**Rationale.** The loop pairs rows with zip, which pairs by position, and the stem states that the row order can differ between the extracts, so a correctly loaded row can sit at a different index in each extract and be reported as a mismatch; pairing each source row with the target row carrying the same id removes that false report. zip also stops at the end of the shorter list and never inspects ids, so a row present in only one extract is silently ignored: with a source of three rows and a target holding the first two of them, the function returns an empty list even though a row is missing, so those ids must be reported. The target amount carries a floating point rounding error, and exact inequality then fires on a correct value, because 0.1 + 0.2 evaluates to 0.30000000000000004, which is not equal to 0.3; allowing for that rounding, whether by a small tolerance or by rounding both values to two decimal places, removes the false report, which is why the option names the allowance rather than one particular mechanism. Returning at the first differing amount is not required for a trustworthy result and would hide every later difference. Sorting both extracts by amount and still pairing by position does not bring the rows that belong together into the same position: a row missing from the target still shifts every later pairing, and the rounding error can move a row within the sort order. Converting the amounts to strings does not remove the rounding difference, because str(0.1 + 0.2) is '0.30000000000000004' while str(0.3) is '0.3', so the comparison still fails on a correct value.

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

A nightly export and a database query each return a list of dictionaries, one row per reference code, with the keys `reference` and `value`. The team has agreed a tolerance of 0.01 when comparing values. A test compares the two lists with the function below. In each situation, take the two lists to hold the same rows in the same order apart from what that situation describes. In which of these situations does `datasets_match` return `False`?

```python
def datasets_match(source, target):
    return source == target
```

| | Option |
|---|---|
| **KEY** | The target list holds the same rows as the source list, but in a different order. |
| **KEY** | One reference's `value` differs between the two lists by a floating point rounding error smaller than the agreed tolerance. |
| **KEY** | The target list holds one row fewer than the source list, and the rows it does hold match the source rows. |
|  | Each dictionary in the source list was built with `value` before `reference`, and each dictionary in the target list with `reference` before `value`. |
|  | One reference's `value` is the integer `10` in the source list and the float `10.0` in the target list. |
|  | One reference's `value` is `None` in the source list and `None` in the target list. |

Key set: The target list holds the same rows as the source list, but in a different order. + One reference's `value` differs between the two lists by a floating point rounding error smaller than the agreed tolerance. + The target list holds one row fewer than the source list, and the rows it does hold match the source rows.

**Rationale.** List equality with == requires the two lists to hold the same number of elements and compares those elements position by position, and dictionary equality compares keys and values. The same rows in a different order therefore put different dictionaries at the same positions, so the lists compare unequal and the function returns False even though no value has changed. Two floating point values that differ by a rounding error are unequal under ==, so the dictionaries holding them are unequal and the function returns False; the agreed tolerance plays no part, because the function never applies it. Lists of different length are never equal, so a target holding one row fewer returns False whatever its remaining rows hold. The other three situations all return True. Dictionary equality ignores the order in which the keys were inserted, so dictionaries built with value before reference compare equal to dictionaries built with reference before value. The integer 10 and the float 10.0 compare equal in Python, so a value stored as an integer on one side and as a float on the other leaves the two dictionaries equal. None compared with None is True, so a value of None on both sides compares equal, which is where a candidate carrying SQL NULL behaviour across to Python expects False. A trustworthy comparison would pair rows on the reference code, report references present on one side only, and compare values within the agreed tolerance, none of which a bare == provides.

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

