# Administrator Guide

Every administrator function, step by step. The Operations Guide covers the rhythm of the live week; this guide covers what each screen does.

You sign in with the administrator username and password set when the application was deployed. Administrators and participants use the same sign-in page, so the first field is labelled **Participant code**; type the administrator username into it. The application sends you to the right place based on your account.

Across the top of every administrator screen is the navigation: Overview, Participants, Results, Statistics, Demand, Items, Audit, Export, Account, and Sign out on the right. A few screens carry a fuller title than their navigation label, and this guide names both.

## Contents

1. [First sign-in and rotating your password](#1-first-sign-in-and-rotating-your-password)
2. [Creating participants and the Allocation Register](#2-creating-participants-and-the-allocation-register)
3. [The participants list](#3-the-participants-list)
4. [Regenerating a password](#4-regenerating-a-password)
5. [Resetting an attempt](#5-resetting-an-attempt)
6. [Overview](#6-overview)
7. [Results](#7-results)
8. [Cohort statistics](#8-cohort-statistics)
9. [Module demand](#9-module-demand)
10. [Item analysis and retiring a question](#10-item-analysis-and-retiring-a-question)
11. [Audit log](#11-audit-log)
12. [Close and export](#12-close-and-export)
13. [Times and time zones](#13-times-and-time-zones)

## 1. First sign-in and rotating your password

The administrator account is created from `ADMIN_USERNAME` and `ADMIN_PASSWORD` the first time the seed runs. That password was typed into a configuration file, so it should not stay in use.

1. Sign in with the username and password from the deployment.
2. Go to **Account**. The screen reads "Change the administrator password. Rotate it from the bootstrap value before go-live."
3. Fill in **Current password**, then **New password** (at least 12 characters) and **New password again**.
4. Choose **Change password**. On success the screen says "Password changed. Use the new password from your next sign in." The change is recorded in the audit log as `admin.password_rotated`.

If the two new entries differ you get "The new passwords do not match."; if the current one is wrong you get "The current password is not correct." Nothing changes in either case.

Do this before you create any participants. If you forget the administrator password there is no reset link, and re-running the seed will not help: the seed is idempotent and never changes the password of an administrator that already exists, so it simply reports "Administrator "admin" already exists. Nothing changed." Recovery means someone with database access replacing the administrator's stored password hash, or a fresh deployment. Keep the password somewhere safe.

## 2. Creating participants and the Allocation Register

Participants are created in bulk. The system never asks for a name or an email address, because it stores neither.

1. Go to **Participants**.
2. In the **Create participants** card, put the number you need in the **How many** field. The hint reads "1 to 200. Codes continue from the next free number."
3. Choose **Create participants**. The application creates `participant-01` upward, each with a generated password of three words and a number, at least fourteen characters, for example `garnet-feather-binder-891`.
4. The **Allocation Register** appears, headed "Allocation Register, shown once", with three columns: Participant code, Initial password, and an empty Allocated to column.

**The register is shown once.** The passwords are stored only as hashes, so nothing can show them to you again; the screen says so, and points you at Regenerate password if one is lost. Before you leave the page:

1. Choose **Download CSV**. The file is named `allocation-register.csv` and its header row is `Participant code,Initial password,Allocated to`.
2. Save it somewhere you keep confidential material.
3. Fill in the Allocated to column offline, matching each code to a person.

The screen states the rule plainly: complete this offline and never upload it anywhere. That register is the only thing in existence that connects a code to a person, and keeping it out of the system is the whole privacy model. Do not email it as a whole, do not put it in a shared drive others can read, and send each participant only their own line.

If you need more participants later, create them the same way. Numbering continues from the highest already used, and you get a register for just the new ones.

## 3. The participants list

Below the create card, the **Participant list** shows one row per participant:

| Column | Meaning |
|---|---|
| Code | The participant code. There is no name, by design. |
| Test automation, SQL, Python | Status of each assessment: Not started, In progress or Submitted, with the **Reset** button for that assessment beside it. |
| Resets | How many attempts have been reset for this participant. |
| Last activity | When they last did anything, in Melbourne time, or "Never" if they have not signed in. |
| Actions | **Regenerate password**. |

Reset for an assessment that is Not started is greyed out and cannot be pressed: there is nothing to reset.

Opening this page also finalises any attempt whose timer has run out, so a participant who abandoned an attempt shows as Submitted with their saved answers rather than sitting at In progress.

## 4. Regenerating a password

Use this when a participant has lost their password.

1. Find their code in the list.
2. Choose **Regenerate password** in the Actions column.
3. The new password appears in a notice on that row: "New password for participant-NN, shown once: ...". Copy it now, because reloading the page clears it.
4. Pass it to the participant through delivery management, and update your offline register.

The old password stops working immediately. The action is audited as `participant.password_regenerated`; the password itself is never written to the audit log or anywhere else in plain text.

## 5. Resetting an attempt

A reset voids an attempt and lets the participant take that assessment again with a newly drawn paper. Use it for genuine technical failures, not because someone wants another go.

1. Find the participant, and choose **Reset** beside the status of the assessment concerned.
2. A dialog opens, titled "Reset *assessment* for *participant code*". It says: "The current attempt is archived in full for audit and the participant starts this assessment fresh with a newly drawn paper. This cannot be undone."
3. **Type a reason** in the **Reason** field. It is required, and the hint says it is recorded in the audit log. Write something a reader in six months would understand, for example `Laptop lost power at question 4, confirmed via delivery management.` Submitting with the field empty just returns "A reason is required."
4. Choose **Reset attempt**. Cancel leaves everything untouched.

What happens: the attempt is voided and archived, and everything about it is kept, including the paper served and the answers given. The assessment returns to Not started for the participant and the Resets count goes up by one. When they start again, the attempt counter increments, which changes the seed, so the paper is drawn afresh: the item chosen for each slot and the order of everything on screen are re-drawn. It is not the same paper, but individual questions can recur, because each slot holds only two or three calibrated items to draw from.

The reset is audited as `attempt.reset` with the reason. You can read the archived attempt in Results, on the participant's detail page, under **Archived attempts (reset)**, which also shows the reason you typed and when it was recorded. Exports label a voided attempt's status as Reset.

## 6. Overview

The landing screen.

- **Participants**: how many exist.
- **All three complete**: how many participants have submitted all three, and how many are still to finish.
- **Question bank**: the version in use and when it was frozen.
- **Exercise**: Open or Closed.
- Per assessment: a card showing how many of the cohort have submitted, a completion bar, and the counts for Submitted, In progress and Not started.
- **Reports and operations**: a linked list into Participants, Results, Statistics, Module demand, Item analysis, Audit log and Export.

Expired attempts are finalised when this page loads, so the numbers are always current.

## 7. Results

Two tables.

**Training plans ready** lists the participants who have submitted all three assessments: Code, Prescribed hours, Shorthand and Modules with each module's outcome.

**Every participant and assessment** is one row per participant per assessment, including assessments not yet started: Code, Assessment, Status, Sections (each section score against the questions served, marked threshold met or threshold not met), Modules (the outcomes that assessment decides), Time, Seed, Bank, Resets and Detail.

Every result is reproducible. The seed is the SHA-256 of the participant, the assessment, the attempt number and the bank version, so the same inputs always rebuild the same paper. The table shows the first eight characters; the participant's detail page shows the seed in full.

**Expand** in the Detail column opens that participant's detail page, which holds everything:

- Their training plan, with prescribed hours, each module's outcome and course name, and, for reporting only, the shorthand code.
- Each attempt, with its status, attempt number, time used, started and submitted times, bank version, full seed, section scores, module outcomes, and the paper exactly as served, in the order it was served. An attempt finalised by the timer is marked "(timer expired)".
- Each question on the paper opens to show the stem and, for single and multiple choice, the options with the correct one marked **Key** and the participant's own marked **Chosen**. An ordering item instead shows the arrangement as served, the participant's answer and the key; a matching item lists every token with where it was placed, the bucket it belonged in, and whether that was correct. Below either comes **Rationale**, the written explanation of why the key is right and the alternatives wrong, and **Source anchor**, the course chapter and topic the question is drawn from.
- Archived attempts from any reset, listed separately at the foot of the page.

The rationale and source anchor are what you use when a participant queries a question. Participants never see either, and never see any score.

## 8. Cohort statistics

**Statistics** in the navigation; the screen is headed "Cohort statistics". Submitted attempts only: reset attempts are excluded, and an attempt finalised by the timer counts like any other.

Per section: how many attempts, the mean, the median, the range, a line saying how many met the threshold and what the threshold is, and a distribution chart of scores with the threshold marked by an amber line.

Drawn as an inline SVG bar chart, no chart library and no external chart service, because nothing about this application calls out to anywhere.

## 9. Module demand

**Demand** in the navigation; the screen is headed "Module demand". The licence-purchasing view. One row per module: the module and its title, the course it maps to, how many participants have it Prescribed, how many at Evidence review, how many Credited, the hours it carries, and the prescribed hours that module accounts for. A final line gives the total prescribed hours across the cohort.

This is the number to take to whoever buys the course licences. Modules at Evidence review are not counted as prescribed hours, because they are provisionally credited pending a reviewer confirming real work evidence. GIT-1 is shown as Not assessed: this tool does not decide it.

The screen notes that a participant counts towards a module as soon as the assessment gating it is submitted, so the numbers fill in during the week.

## 10. Item analysis and retiring a question

**Items** in the navigation; the screen is headed "Item analysis". One row per question in the bank:

| Column | Meaning |
|---|---|
| Item | The question's identifier, for example `sql-08-a`. |
| Assessment | Test automation, SQL or Python. |
| Slot | The topic position it sits in. |
| Type | single, multi, ordering or matching. |
| Attempts | How many submitted attempts were served it. |
| Facility | The percentage who answered it correctly. |
| Distribution | How the answers fell across the options, unanswered included. |
| Flag | "Attention" when the question looks wrong. |
| State | Active or Retired. |
| Action | **Retire**, or the word Retired once it has been. |

Above the table, a summary lists every flagged item with the reason in words, and a line gives the bank version and how many items it holds.

A question is flagged when, with at least five attempts, almost nobody or almost everybody got it right, or when its facility is far out of line with the other questions in the same slot. A flag is a prompt to look, not a verdict.

To retire a question:

1. Find it and choose **Retire**. The dialog is titled "Retire *item id*" and says: "Removed from future papers only. Past attempts stand: everyone who has already been served this item keeps their result." It then names the assessment and slot, and warns that retiring is refused if the slot would be left with no active item.
2. Record why in the **Reason (optional)** field. It is not required, but a reason is worth writing, and it goes into the audit log.
3. Choose **Retire item**.

Retiring removes the question from future papers only. Attempts already taken are unaffected, and recomputing past results is deliberately out of scope. The action is audited as `item.retired`.

**The slot-depth guard.** Every participant must get one question from every topic slot, so the last remaining active question in a slot cannot be retired. If you try, the dialog stays open and refuses in plain words, naming the item, the assessment and the slot, for example:

> Item ta-10-b cannot be retired: Test Automation Fundamentals slot 10 would be left with 0 active items and every paper serves 1. Retire an item only while its slot keeps at least 1 active item.

The question stays in the bank exactly as it was and the decision goes to the owner.

## 11. Audit log

**Audit** in the navigation; the screen is headed "Audit log". Every state-changing action, newest first, in six columns: Time, Actor, Action, Target, Reason (an em dash where none was given) and Details, where **Show** opens the recorded JSON.

Recorded actions include the administrator bootstrap (`admin.bootstrap`) and password rotation (`admin.password_rotated`), bulk participant creation (`participants.bulk_created`), password regeneration (`participant.password_regenerated`), attempt resets (`attempt.reset`), question retirement (`item.retired`), closing the exercise (`exercise.closed`) and every export download (`export.created`). Participants' own attempt events appear too: `attempt.started`, `attempt.submitted` and `attempt.auto_submitted` at expiry.

The count of records sits above the table. Filter by action from the **Action** list, which offers only the actions that have actually occurred, and choose **Filter**. The table shows fifty records to a page with Previous and Next below it. **Download CSV** gives you the whole log, unfiltered and unpaginated.

## 12. Close and export

**Export** in the navigation. The screen offers the four files individually, then Close and export at the foot.

Four files:

| File | Contents |
|---|---|
| `results.csv` | One row per participant per assessment: status, attempt number, reset count, section scores against the threshold, module prescriptions, shorthand, time used, seed, bank version and submitted time. |
| `item-analysis.csv` | One row per question: attempts, facility, answer distribution, any outlier reason, and whether it is retired. |
| `audit-log.csv` | The complete audit log. |
| `archive.json` | Full attempt detail, including archived attempts from resets, with the served items resolved. |

You can download any file individually at any time, before or after closing, with the **Download** buttons. Each download is itself recorded in the audit log as `export.created`.

**Close and export** is for when the exercise is finished. The button opens a dialog titled "Close the exercise and export" which says: "Closing stops any new attempt from starting. Attempts already in progress finish normally, and every result stays exactly as it is. The closure is recorded in the audit log with the time." and "All four export files are produced: results, item analysis, audit log and the JSON archive." Cancel backs out; **Close and export** confirms.

Once confirmed, the screen names the four files with their row counts and tells you to download them from the buttons above; the closure is recorded in the audit log. Closing is idempotent: the closing time is kept from the first time you do it, the button then reads **Close and export again**, and a notice says downloading again is safe.

Every file identifies people by participant code, never by name or any other personal data; `archive.json` also carries the system's own opaque record identifiers. Check the files when they download; then check them again with the verification command in the Operations Guide.

## 13. Times and time zones

Everything is stored in UTC and displayed in Australia/Melbourne time, including through the daylight saving change. Exports carry both a Melbourne-formatted time with its zone and the raw UTC timestamp, for example `2026-09-10 07:43:35 AEST` alongside `2026-09-09T21:43:35.283Z`, so a spreadsheet can sort them correctly.

The assessment timer runs on the server. A participant whose computer clock is wrong is unaffected: their clock changes what they see, never how much time they get.
