# Administrator Guide

Every administrator function, step by step. The Operations Guide covers the rhythm of the live week; this guide covers what each screen does.

You sign in with the administrator username and password set when the application was deployed. Administrators and participants use the same sign-in page; the application sends you to the right place based on your account.

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

The administrator account is created from the deployment configuration the first time the seed runs. That password was typed into a configuration file, so it should not stay in use.

1. Sign in with the username and password from the deployment.
2. Go to **Account**.
3. Enter the current password, then the new one twice.
4. Save. The change is recorded in the audit log as `admin.password_rotated`.

Do this before you create any participants. If you forget the administrator password, there is no reset link; someone with access to the server has to re-run the seed against a fresh account, so keep it somewhere safe.

## 2. Creating participants and the Allocation Register

Participants are created in bulk. The system never asks for a name or an email address, because it stores neither.

1. Go to **Participants**.
2. Enter how many participants you need and choose Create.
3. The application creates `participant-01` upward, each with a generated password of three words and digits, at least fourteen characters.
4. The **Allocation Register** appears, with three columns: Participant code, Initial password, and an empty Allocated to column.

**The register is shown once.** The passwords are stored only as hashes, so nothing can show them to you again. Before you leave the page:

1. Choose **Download CSV**.
2. Save it somewhere you keep confidential material.
3. Fill in the Allocated to column offline, matching each code to a person.

The screen states the rule plainly: complete this offline and never upload it anywhere. That register is the only thing in existence that connects a code to a person, and keeping it out of the system is the whole privacy model. Do not email it as a whole, do not put it in a shared drive others can read, and send each participant only their own line.

If you need more participants later, create them the same way. Numbering continues from the highest already used, and you get a register for just the new ones.

## 3. The participants list

One row per participant:

| Column | Meaning |
|---|---|
| Participant | The code. There is no name, by design. |
| Test automation, SQL, Python | Status of each assessment: Not started, In progress, or Submitted. |
| Resets | How many attempts have been reset for this participant. |
| Last activity | When they last did anything, in Melbourne time. |
| Actions | Regenerate password, and Reset per assessment. |

Opening this page also finalises any attempt whose timer has run out, so a participant who abandoned an attempt shows as Submitted with their saved answers rather than sitting at In progress.

## 4. Regenerating a password

Use this when a participant has lost their password.

1. Find their code in the list.
2. Choose **Regenerate password**.
3. The new password is shown once. Copy it now.
4. Pass it to the participant through delivery management, and update your offline register.

The old password stops working immediately. The action is audited as `participant.password_regenerated`; the password itself is never written to the audit log or anywhere else in plain text.

## 5. Resetting an attempt

A reset voids an attempt and lets the participant take that assessment again with a newly drawn paper. Use it for genuine technical failures, not because someone wants another go.

1. Find the participant, and choose **Reset** on the assessment concerned.
2. A dialog explains that the attempt will be archived and the participant will start fresh.
3. **Type a reason.** It is required. Write something a reader in six months would understand, for example `Laptop lost power at question 4, confirmed via delivery management.`
4. Confirm.

What happens: the attempt's status becomes void, and everything about it is kept, including the paper served and the answers given. The assessment returns to Not started for the participant. When they start again, the attempt counter increments, which changes the seed, so the retake draws a different paper from the same bank.

The reset is audited with the reason. You can read the archived attempt under the participant's detail in Results.

Resetting an assessment that was never started is refused: there is nothing to reset.

## 6. Overview

The landing screen.

- Participants created.
- Per assessment: how many are Not started, In progress and Submitted, with a completion bar.
- How many participants have completed all three.
- The bank version in use and when it was frozen.
- Whether the exercise is open or closed.

Expired attempts are finalised when this page loads, so the numbers are always current.

## 7. Results

One row per participant per assessment, showing section scores, whether each section was met, the module outcomes that assessment decides, time used, the seed the paper was drawn from, and the bank version.

Every result is reproducible. The seed is a function of the participant, the assessment, the attempt number and the bank version, so the same inputs always rebuild the same paper.

**Expand** a participant to see everything:

- Their training plan and, for reporting only, the shorthand code.
- Each attempt, with the paper exactly as served, in the order it was served.
- For every question: the participant's answer, the correct answer, the written rationale for why the key is right and the alternatives wrong, and the course topic the question anchors to.
- Archived attempts from any reset, listed separately.

The rationale and anchor are what you use when a participant queries a question. Participants never see either, and never see any score.

## 8. Cohort statistics

Per section: how many attempts, the mean, the median, the range, and a distribution chart of scores with the threshold marked.

Drawn with plain inline graphics, no external chart service, because nothing about this application calls out to anywhere.

## 9. Module demand

The licence-purchasing view. Per module: how many participants have it Prescribed, how many at Evidence review, how many Credited, the hours it carries, and the total prescribed hours across the cohort.

This is the number to take to whoever buys the course licences. Modules at Evidence review are not counted as prescribed hours, because they are provisionally credited pending a reviewer confirming real work evidence.

## 10. Item analysis and retiring a question

One row per question in the bank:

| Column | Meaning |
|---|---|
| Item | The question's identifier, for example `sql-08-a`. |
| Assessment, slot, type | Where it sits and what kind of question it is. |
| Attempts | How many submitted attempts were served it. |
| Facility | The percentage who answered it correctly. |
| Distribution | How the answers fell across the options. |
| Flag | Marked when the question looks wrong, with the reason. |

A question is flagged when, with at least five attempts, almost nobody or almost everybody got it right, or when it is far out of line with the other questions covering the same topic. A flag is a prompt to look, not a verdict.

To retire a question:

1. Find it and choose **Retire**.
2. Record why.
3. Confirm.

Retiring removes the question from future papers only. Attempts already taken are unaffected, and recomputing past results is deliberately out of scope.

**The slot-depth guard.** Every participant must get one question from every topic slot, so the last remaining question in a slot cannot be retired. If you try, the application refuses and names the slot. The question stays in the bank and the decision goes to the owner.

## 11. Audit log

Every state-changing action, newest first: who did it, what they did, to what, why where a reason was given, and when.

Recorded actions include the administrator bootstrap and password rotation, bulk participant creation, password regeneration, attempt resets, question retirement, closing the exercise and creating exports. Participants' own attempt events appear too: started, submitted and auto-submitted at expiry.

Filter by action, and download the whole log as CSV.

## 12. Close and export

Do this when the exercise is finished.

**Close and export** records the closing time and stops any new attempt from being started. Attempts already under way are not interrupted. Closing is recorded in the audit log; the closing time is kept from the first time you do it.

Four files:

| File | Contents |
|---|---|
| `results.csv` | One row per participant per assessment: section scores, section outcomes, module prescriptions, time used, seed, bank version. |
| `item-analysis.csv` | One row per question: attempts, facility, answer distribution. |
| `audit-log.csv` | The complete audit log. |
| `archive.json` | Full attempt detail, including archived attempts from resets. |

Every file identifies people only by participant code. Check them when they download; then check them again with the verification command in the Operations Guide.

You can download any file individually at any time. Close and export simply does all four and records the closure.

## 13. Times and time zones

Everything is stored in UTC and displayed in Australia/Melbourne time, including through the daylight saving change. Exports carry both a Melbourne-formatted time with its zone and the raw UTC timestamp, so a spreadsheet can sort them correctly.

The assessment timer runs on the server. A participant whose computer clock is wrong is unaffected: their clock changes what they see, never how much time they get.
