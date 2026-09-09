# Operations Guide

The runbook for the live week. Written for the administrator who is running the exercise day to day.

The system holds no personal data. It knows participants only as numbered codes, and the register that maps codes to people lives offline with you. That shapes almost everything below: when you need to reach someone, you do it through delivery management, not through the application.

## Contents

1. [Before the week starts](#1-before-the-week-starts)
2. [Daily monitoring](#2-daily-monitoring)
3. [Resetting an attempt](#3-resetting-an-attempt)
4. [A participant cannot sign in](#4-a-participant-cannot-sign-in)
5. [A suspected bad question](#5-a-suspected-bad-question)
6. [Adding a late participant](#6-adding-a-late-participant)
7. [Closing the exercise](#7-closing-the-exercise)
8. [Teardown and the deletion confirmation](#8-teardown-and-the-deletion-confirmation)
9. [Troubleshooting](#9-troubleshooting)

## 1. Before the week starts

Work through this in order. The Hosting Guide covers the deployment itself.

- [ ] The question bank is signed off, loaded and frozen. The Overview's **Question bank** card shows the version and the time it was frozen, for example `Version 1` and `Frozen 10 Sep 2026, 07:43`.
- [ ] The pilot has been run with two internal accounts, covering both drag-and-drop types: an ordering question moved with the mouse, with its up and down arrow buttons, and from the keyboard, and a matching question dragged with the mouse and then placed with the selector under each item. The pilot attempts have been reset away.
- [ ] The administrator password has been changed from the one in the deployment configuration. **Account**, current password, new password twice, **Change password**. At least twelve characters.
- [ ] The real participants have been created in one bulk creation, and the Allocation Register has been saved **once** with **Download CSV** before leaving the page.
- [ ] The register has been completed offline, matching each code to a person, and stored where you keep confidential material. It has not been uploaded anywhere, emailed, or put in a shared drive that others can read.
- [ ] Each participant has been told, through delivery management, their own code, their own password and the web address. Send each person only their own line of the register.
- [ ] `npm run verify:no-pii` has been run against production and ended with `PASS no personal-data columns in the schema.` On the self-hosted path it opens the same data directory as the running application, so run it at a quiet moment rather than while people are mid-attempt.
- [ ] You have checked that a timestamp on screen matches Melbourne time. Times appear in the form `10 Sep 2026, 07:43`.

Tell participants: three short assessments, ten questions and ten minutes each, one attempt each, take them in any order, and contact you if anything goes wrong technically.

## 2. Daily monitoring

Once a day, sign in and look at the Overview.

Four cards run across the top: Participants, All three complete, Question bank and Exercise. Below them sits one card per assessment, each showing `n of m submitted` and a completion bar whose legend gives the three counts.

- **Not started** counts tell you how many have not begun. The Overview gives you the number only; open **Participants** for the codes behind it. You cannot see who those people are, and neither can the system. Take the codes to delivery management, who hold the register with you, and chase the people behind them.
- **In progress** counts should be small and should not persist. An attempt whose timer has run out is finalised automatically the next time anything looks at it, whether that is an administrator screen or the participant's own dashboard, so someone who abandoned an attempt shows as Submitted with whatever they had saved rather than sitting at In progress for ever.
- **Submitted** counts rising steadily is the healthy picture.

Then look at Item analysis, reached from **Items**. Anything the application is unhappy about appears in a banner at the top of that screen, `N items flagged for attention`, each named with its reason, and those rows carry an Attention flag. Section 5 covers what to do about one.

There is nothing to do daily beyond this. The exercise runs itself.

## 3. Resetting an attempt

Reset when a participant hit a genuine technical failure: the browser crashed, the machine lost power, the connection dropped and they could not get back in. A reset archives the whole attempt and lets the participant start that assessment again with a freshly drawn paper.

Do not reset because a participant is unhappy with how they did. The exercise decides a starting point for training; it is not an examination to be re-sat.

1. Confirm what happened, through delivery management. Get the participant's code.
2. **Participants**, find the code, and check the status of the assessment in question. It must be In progress or Submitted. On Not started the Reset button is greyed out, because there is nothing to reset.
3. Choose **Reset** on that assessment. A dialog opens, headed `Reset <assessment> for <code>`, and says that the current attempt is archived in full for audit and the participant starts fresh with a newly drawn paper.
4. Type a reason. The field is required. Be specific and factual: `Browser crashed at question 6, confirmed with participant via delivery management.` The reason goes in the audit log and is the record of why the attempt was set aside.
5. Choose **Reset attempt**. The assessment returns to Not started and the participant's Resets count goes up by one.
6. Tell the participant, through delivery management, that they can go again.

The reset attempt is kept in full, including the paper served and the answers given. Find it in **Results**: **Expand** the participant, then look under **Archived attempts (reset)**. It shows the reason and when it was recorded, the section score, the time used, the seed, and the whole served paper, with each question opening to reveal the answer given, the key, the rationale and the source anchor. The retake is drawn from a new seed, so it is not the paper they saw before.

Resets take under a minute. There is no limit on them, but each one shows in the Resets column against the participant, and a participant with several resets is worth a conversation.

## 4. A participant cannot sign in

Work through this in order.

1. **Check the code.** It is `participant-01` style, with the hyphen and the leading zero for numbers under ten. It is not their name or their email address.
2. **Check they are using the password from the register**, not one they have invented.
3. **Ten failed attempts within fifteen minutes lock sign-in.** The count is kept both per participant code and per network address. Nothing on screen says so: a locked account gets the same `That participant code and password do not match.` as a mistyped password. Every further attempt while locked is itself counted as a failure and restarts the fifteen minutes, so tell them to stop trying, wait a clear fifteen minutes, then try once, carefully. If a group shares one office connection, several people guessing at once can trip the address limit for everybody, so ask them to try one at a time.
4. **If the password is genuinely lost**, use **Regenerate password** against their code. The old password stops working at once. The new one appears beside the button, once, and is gone as soon as the page is reloaded. Copy it, pass it to the participant through delivery management, and update your offline register.

You cannot look up a participant's password. Nobody can: only the hash is stored.

## 5. A suspected bad question

A question is suspect when a participant disputes it, or when Item analysis flags it.

1. Open **Items** and find the item by its identifier, for example `sql-09-a`. Look at Attempts, at Facility, which is the percentage who answered it correctly, and at Distribution, which shows how the answers fell.
2. An item is flagged only once it has at least five attempts, and then only when almost nobody or almost everybody got it right, or when its facility is far out of line with the other items in the same slot. The flag names the reason and gives the numbers. A flag is a prompt to look, not a verdict.
3. Read the question in **Results**: **Expand** any participant who was served it, find it in the Served paper by the same identifier, and open it. You get the question, the options with the key marked, that participant's answer, the **Rationale** and the **Source anchor**, which is the course topic the question belongs to. The rationale is written to answer exactly this: why the key is right and why each alternative is wrong.
4. Decide:
   - **The question is sound.** Most disputes end here. Explain the rationale to the participant through delivery management. There is no in-application dispute process by design.
   - **The question is faulty.** Retire it. **Items**, find it, choose **Retire**, record why in the reason field, and choose **Retire item**. The reason is optional; write one anyway. Retiring removes the question from future papers only.
5. Retiring is refused if it would leave a slot with no question to serve. The refusal names the assessment, the slot and what would be left, and appears beside that row under the heading `Not retired`. Nothing is changed: the question stays in the bank and the decision goes to the owner.
6. Past attempts stand. Recomputing results after a question is retired is deliberately out of scope. If the owner decides otherwise, that is a decision taken offline.

Note what you did and why. The audit log records the retirement as `item.retired`; your own note records the reasoning.

## 6. Adding a late participant

Bulk creation always continues from the highest number already used, so creating three more after fifteen gives you `participant-16` through `participant-18`.

1. **Participants**, put the number into **How many**, then choose **Create participants**.
2. An Allocation Register for the new participants only appears, headed `Allocation Register, shown once`. Choose **Download CSV** before you leave the page. The passwords cannot be shown again.
3. Add the new lines to your offline register.
4. Pass each person their own code and password through delivery management.

## 7. Closing the exercise

Do this when the last participant has finished, or when the window closes and you are content to finalise whatever is there. **Closing cannot be undone from the application.** From that moment nobody can begin an assessment they have not already started, and there is no reopen control, so do not close early.

1. Check the Overview. Closing finalises nobody: an attempt already under way runs on to its own submission or its own timer expiry. Anyone still showing Not started will simply never be able to start.
2. Go to **Export** and choose **Close and export**, then **Close and export** again in the dialog to confirm. The screen then reports `Closed <date and time>. No new attempts can start.`, lists the four files with their row counts, and records the closure in the audit log. The Overview's Exercise card changes to Closed. The button becomes **Close and export again**, which is safe to use and is itself audited; the first closing time is the one that stands.
3. Download all four files from the Download list on the same screen. Closing produces the files and records that it did; it does not download them for you.
   - `results.csv`, one row per participant per assessment, with section scores and whether each section was met, module outcomes, time used, seed and bank version.
   - `item-analysis.csv`, one row per question with attempts, facility, answer distribution, any flag and whether it is retired.
   - `audit-log.csv`, every state-changing action with its actor, target, reason and time.
   - `archive.json`, the complete attempt detail including archived attempts from resets.
4. Open each file and check it. Every one should contain participant codes and nothing that identifies a person. Each timestamp appears twice, once formatted for Melbourne with its zone and once as the raw UTC instant, and a module column is blank wherever that row's assessment does not decide that module.
5. Run the no-personal-data verification against production one last time, over the files you have just downloaded, giving their real paths:
   ```bash
   npm run verify:no-pii -- results.csv item-analysis.csv audit-log.csv archive.json
   ```
   It prints the database columns, then a `PASS` line for each file. It exits with an error if anything looks personal.
6. Hand all four files to the owner, together with your offline register if the owner is to hold it. Ask the owner to confirm receipt in writing.
7. Wait for that confirmation before going any further.

## 8. Teardown and the deletion confirmation

Only once the owner has confirmed receipt of the exports.

1. Stop the application first, then follow section 10 of the Hosting Guide, which runs `npm run db:teardown -- --yes`. Without `--yes` it refuses and changes nothing. With it, the self-hosted path removes the data directory and confirms it is absent; a managed database has every application table dropped, after which you delete the database itself in the provider console and revoke its credentials. Either way it prints one line beginning `DELETION CONFIRMED`, carrying the instant in UTC.
2. Delete the deployment itself, and the copy of the repository on the server including its `.env` file and its `certs/` directory.
3. Confirm the deletion to the owner in writing. Something like:

> The Capability Placement assessment has been torn down.
>
> The database was deleted on [date] at [time] Melbourne time. The deletion was verified by the teardown process, which confirmed the data no longer exists: [paste the DELETION CONFIRMED line, which records the same instant in UTC].
>
> The deployment and its configuration have been removed. The four export files handed to you on [date] are now the only record of the exercise.
>
> The Allocation Register was completed offline and never entered the system. [Say what has happened to your copy: destroyed, or retained by you until a stated date.]

4. Destroy or file your offline register according to whatever the owner decided. It is the only document that ever linked a code to a person.

## 9. Troubleshooting

| Symptom | What is happening | What to do |
|---|---|---|
| Participant closed the browser mid-attempt | Answers were saved as they went, and the timer has been running on the server throughout | They sign in again and choose Continue, and carry on with the time that remains. |
| A participant's timer ran out while they were offline | The server finalises the attempt with the answers already saved, as soon as anything looks at it | Nothing to do. Unanswered questions score zero. |
| Participant signed in on two devices | Both work; the most recent save wins | Ask them to use one. Nothing is lost. |
| Participant pressed Submit twice | Submitting is idempotent | Nothing to do. The second press simply returns the confirmation screen. |
| Participant says an ordering question will not drag | Trackpad, browser or assistive settings | Every ordering question also has up and down arrow buttons on each item, and works from the keyboard: focus an item, Space to pick it up, arrow keys to move it, Space to drop it. |
| Participant says a matching question will not drag | The same | Every matching question has a selector under each item that places it in a category without any dragging. |
| Participant asks what they scored | Participants never see scores by design | Explain that the output is their training plan, which is built from what they demonstrated. Do not quote or promise a score. |
| An attempt shows In progress long after its timer | Nothing has yet loaded a screen that finalises it | Open the Overview or the participants list; either one finalises expired attempts. |
| A participant presses Start and lands back on the instructions screen | The exercise has been closed, so no new attempt can begin, and the application says nothing about it | Intended. Closing cannot be undone from the application, so anyone who had not started stays Not started. |
| Nobody can reach the site | The process stopped or the machine rebooted | Restart it. Section 7 of the Hosting Guide covers running it as a service so this does not happen. |
| The certificate has expired | A self-signed certificate from `npm run cert:dev` lasts 90 days | Regenerate it and restart, or install a certificate from a certificate authority. |
| You need yesterday's state back | You have a backup of the data directory, taken as section 8 of the Hosting Guide describes | Stop the application, replace the directory with the backup, start it again. |
| An export column is not what you expected | Module columns are blank wherever that row's assessment does not decide the module, and every time appears twice, Melbourne and UTC | Check the file against section 12 of the Administrator Guide before assuming a fault. |
