# Course syllabi used for blueprint alignment

Fetched 2026-09-09. Published section and lesson titles only; used to check that every blueprint topic in docs/04 maps to something the selected course teaches. Nothing here is copied into items.

## TA-1 - ISTQB Certified Test Automation Engineer CTAL-TAE V2 (Udemy, One Run Academy)

Fetched via a browser session (direct fetch returned HTTP 403). 10 sections, 80 lectures, following the ISTQB CTAL-TAE v2.0 syllabus chapters:

1. Introduction and objectives for test automation (purpose of automation, advantages and limitations, automation versus manual, technical success factors)
2. Preparing for test automation (SUT factors, tool evaluation and selection, design for testability)
3. Test automation architecture (generic TAA, layers, design approaches, capture-replay, data-driven, keyword-driven, model-based)
4. Implementing test automation (risks, maintainability, test pyramid and layers, when to automate, what not to automate)
5. Implementation and deployment strategies (CI/CD pipelines, run triggers, environments, configuration management)
6. Test automation reporting and metrics (what to measure, logging, failure evidence, reporting)
7. Verifying the test automation solution (verifying the TAS, test environment components, flaky tests and non-deterministic results)
8. Continuous improvement opportunities (maintenance, refactoring, improving the solution)

The published "What you will learn" bullets confirm: fundamentals of test automation, configurations and tool selection, TAA, implementing tests with risk mitigation and maintainability, CI/CD deployment, metrics and reporting, verification, continuous improvement.

Blueprint alignment: TA slots 1 (purpose, ch.1), 2 (pyramid and layers, ch.4), 3 (agile quadrants, test types and levels, ch.1 and 4), 4 (regression versus progression, ch.1), 5 (automation candidacy, ch.4), 6 (what not to automate, ch.4), 7 (maintenance cost, ch.4 and 8), 8 (evidence on failure, ch.6), 9 (run triggers, ch.5), 10 (flaky tests, ch.7).

## SQL-1 - Intermediate SQL (DataCamp)

Chapter 1 Data aggregation: summary values, one grouping column, multiple grouping columns. Chapter 2 Data transformation: basic and complex transformations. Chapter 3 Data filtering: basic filtering, multiple conditions, complex filtering. Chapter 4 Conditional operations: conditional transformation and aggregation.

## SQL-1 - Joining Data in SQL (DataCamp)

Combining data vertically (stacking rows with UNION). Combining data horizontally (keeping all rows with LEFT JOIN, keeping matching rows with INNER JOIN, joining on multiple columns). The wider course covers set operations (UNION, INTERSECT, EXCEPT) and subqueries.

Blueprint alignment: SQL slots 1 (SELECT and WHERE, filtering), 2 (INNER versus LEFT JOIN), 3 (GROUP BY and HAVING), 4 (subquery reading), 5 (NULL behaviour in filters), 6 (DISTINCT and ORDER BY).

## SQL-2 - SQL for Testers (LinkedIn Learning, Dave Westerveld)

1. Getting started: what SQL is and why a tester uses it, tools, first queries, more complex queries. 2. Querying SQL data: setting up a site for testing, validating user workflows, validating data integrity, worked example. 3. Using SQL for data generation: create new entries, update entries, delete data, challenge. 4. Testing SQL queries: transactions, field constraints, schema validation, security testing, performance testing.

Blueprint alignment: SQL slots 7 (set operations for reconciliation and data integrity), 8 (records missing from a target), 9 (changed values between source and target), 10 (test data hygiene: inserting and cleaning deterministic rows).

## PY-1 - Programming for Everybody, Getting Started with Python (Coursera, University of Michigan)

Why we program; installing Python; variables and expressions (constants, variables, numeric expressions, data types, comments, input-process-output); conditional code (if and else, multiple conditions); functions (defining, arguments, return values); loops and iteration (definite loops, finding maximum and minimum, loop idioms). The same textbook continues into strings, lists and dictionaries.

Blueprint alignment: Python slots 1 (types and truthiness), 2 (loop and condition), 3 (functions), 4 (lists and dicts), 5 (strings), 6 (short realistic snippet).

## PY-2a - Python Automation Testing With Pytest (Udemy, Kumar S)

Fetched via a browser session (direct fetch returned HTTP 403). Sections: introduction; installation and setup; Pytest 101 (create project and first test); assertions and test discovery; skip, mark and pytest options; parameterize and setup and teardown (fixtures); customisations; pytest-bdd; pytest-playwright (optional). Highlighted topics: test naming and discovery, assertions, skipping tests and markers, parametrised testing, fixtures, command line arguments.

Blueprint alignment: Python slots 7 (discovery and naming), 8 (assert semantics), 9 (fixtures and parameterisation).

## PY-2b - Introduction to Testing in Python (DataCamp)

Chapter 1 Creating tests with pytest (first test suite, pytest.raises, invoking from the CLI, keyword selection, markers, xfail, conditional skip). Chapter 2 Fixtures (data preparation, chaining, autouse, teardown). Chapter 3 Basic testing types (unit, feature, integration, performance). Chapter 4 unittest.

Blueprint alignment: Python slots 8 (assert and failure meaning), 9 (fixtures), 10 (comparing datasets: order, missing rows, tolerance, as feature and integration tests over data).
