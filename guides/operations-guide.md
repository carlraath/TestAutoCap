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

- [ ] The question bank is signed off, loaded and frozen. The Overview shows a bank version and the time it was frozen.
- [ ] The pilot has been run with two internal accounts, including operating a drag-and-drop question once with the mouse and once with the keyboard, and the pilot attempts have been reset away.
- [ ] The administrator password has been changed from the one in the deployment configuration. Account, change password.
- [ ] The real participants have been created in one bulk creation, and the Allocation Register has been downloaded **once**.
- [ ] The register has been completed offline, matching each code to a person, and stored where you keep confidential material. It has not been uploaded anywhere, emailed, or put in a shared drive that others can read.
- [ ] Each participant has been told, through delivery management, their own code, their own password and the web address. Send each person only their own line of the register.
- [ ] `npm run verify:no-pii` has been run against production and passed.
- [ ] You have checked that a timestamp on screen matches Melbourne time.

Tell participants: three short assessments, ten questions and ten minutes each, one attempt each, take them in any order, and contact you if anything goes wrong technically.

## 2. Daily monitoring

Once a day, sign in and look at the Overview.

- **Not started** counts tell you who has not begun. You cannot see who they are, and neither can the system. Take the codes to delivery management, who hold the register with you, and chase the people behind them.
- **In progress** counts should be small and should not persist. An attempt whose timer has run out is submitted automatically the next time anyone looks, so a participant who abandoned an attempt shows as Submitted with whatever they had saved, not as In progress forever.
- **Submitted** counts rising steadily is the healthy picture.

Then look at Item analysis for anything flagged as an outlier. Section 5 covers what to do about one.

There is nothing to do daily beyond this. The exercise runs itself.

## 3. Resetting an attempt

Reset when a participant hit a genuine technical failure: the browser crashed, the machine lost power, the connection dropped and they could not get back in. A reset archives the whole attempt and lets the participant start that assessment again with a freshly drawn paper.

Do not reset because a participant is unhappy with how they did. The exercise decides a starting point for training; it is not an examination to be re-sat.

1. Confirm what happened, through delivery management. Get the participant's code.
2. Participants, find the code, and check the status of the assessment in question. It should be In progress or Submitted.
3. Choose Reset on that assessment.
4. Type a reason. Be specific and factual: `Browser crashed at question 6, confirmed with participant via delivery management.` The reason goes in the audit log and is the record of why the attempt was voided.
5. Confirm. The assessment returns to Not started.
6. Tell the participant, through delivery management, that they can go again.

The voided attempt is kept in full, including the paper served and the answers given. You can see it under the participant's detail in Results, listed as an archived attempt. The retake draws a different paper.

Resets take under a minute. There is no limit on them, but each one is counted against the participant in the list, and a participant with several resets is worth a conversation.

## 4. A participant cannot sign in

Work through this in order.

1. **Check the code.** It is `participant-01` style, with the hyphen and the leading zero for numbers under ten. It is not their name or their email address.
2. **Check they are using the password from the register**, not one they have invented.
3. **Ten failed attempts within fifteen minutes locks sign-in for that account.** It clears itself after fifteen minutes. Ask them to wait, then try once, carefully.
4. **If the password is genuinely lost**, use Regenerate password against their code. The new password is shown once and never again. Copy it, pass it to the participant through delivery management, and update your offline register.

You cannot look up a participant's password. Nobody can: only the hash is stored.

## 5. A suspected bad question

A question is suspect when a participant disputes it, or when Item analysis flags it.

1. Open Item analysis and find the item. Look at its facility, the percentage who answered it correctly, and its answer distribution.
2. A flagged outlier is one that almost nobody or almost everybody got right, or one that is far out of line with the other questions in the same slot. The flag gives the reason.
3. Open the question in Results, under any participant who was served it, to read the question, its key, its rationale and the course topic it anchors to. The rationale is written to answer exactly this: why the key is right and why each alternative is wrong.
4. Decide:
   - **The question is sound.** Most disputes end here. Explain the rationale to the participant through delivery management. There is no in-application dispute process by design.
   - **The question is faulty.** Retire it. Items, find it, choose Retire, and record why. Retiring removes it from future papers only.
5. Retiring is refused if it would leave a slot with no question to serve. The message names the slot. If that happens, the question stays in the bank and the decision goes to the owner.
6. Past attempts stand. Recomputing results after a question is retired is deliberately out of scope. If the owner decides otherwise, that is a decision taken offline.

Note what you did and why. The audit log records the retirement; your own note records the reasoning.

## 6. Adding a late participant

Bulk creation always continues from the highest number already used, so creating three more after fifteen gives you `participant-16` through `participant-18`.

1. Participants, enter the number of new participants, Create.
2. Download the register for those new participants. It is shown once.
3. Add the new lines to your offline register.
4. Pass each person their own code and password through delivery management.

## 7. Closing the exercise

Do this when the last participant has finished, or when the window closes and you are content to finalise whatever is there.

1. Check the Overview. Anyone still In progress will be finalised automatically with their saved answers.
2. Go to Export and choose **Close and export**. Closing records the time and stops any new attempt from being started. Attempts already under way are unaffected.
3. Download all four files:
   - `results.csv`, one row per participant per assessment, with section scores, outcomes, module prescriptions, time used, seed and bank version.
   - `item-analysis.csv`, one row per question with attempts, facility and answer distribution.
   - `audit-log.csv`, every state-changing action with its actor, target, reason and time.
   - `archive.json`, the complete attempt detail including archived resets.
4. Open each file and check it. Every one should contain participant codes and nothing that identifies a person.
5. Run the no-personal-data verification against production one last time, including the export files:
   ```bash
   npm run verify:no-pii -- exports/results.csv exports/item-analysis.csv exports/audit-log.csv exports/archive.json
   ```
6. Hand all four files to the owner, together with your offline register if the owner is to hold it. Ask the owner to confirm receipt in writing.
7. Wait for that confirmation before going any further.

## 8. Teardown and the deletion confirmation

Only once the owner has confirmed receipt of the exports.

1. Follow section 10 of the Hosting Guide. It deletes the database and prints a confirmation line with a timestamp.
2. Delete the deployment itself, and the copy of the repository on the server including its configuration file and certificates.
3. Confirm the deletion to the owner in writing. Something like:

> The Capability Placement assessment has been torn down.
>
> The database was deleted on [date] at [time] Melbourne time. The deletion was verified by the teardown process, which confirmed the data directory no longer exists: [paste the DELETION CONFIRMED line].
>
> The deployment and its configuration have been removed. The four export files handed to you on [date] are now the only record of the exercise.
>
> The Allocation Register was completed offline and never entered the system. [Say what has happened to your copy: destroyed, or retained by you until a stated date.]

4. Destroy or file your offline register according to whatever the owner decided. It is the only document that ever linked a code to a person.

## 9. Troubleshooting

| Symptom | What is happening | What to do |
|---|---|---|
| Participant closed the browser mid-attempt | Answers were saved as they went | They sign in again and continue with the time that remains. |
| A participant's timer ran out while they were offline | The server finalises the attempt with the answers already saved | Nothing to do. Unanswered questions score zero. |
| Participant signed in on two devices | Both work; the most recent save wins | Ask them to use one. Nothing is lost. |
| Participant pressed Submit twice | The second press is ignored | Nothing to do. |
| Participant says a drag-and-drop question will not work with their mouse | Trackpad or accessibility settings | Every such question has arrow buttons and a selector that do the same job. Point them at those. |
| Participant asks what they scored | Participants never see scores by design | Explain that the output is their training plan, which is built from what they demonstrated. |
| An attempt shows In progress long after its timer | Nothing has looked at it yet | Open the participants list; that finalises expired attempts. |
| Nobody can reach the site | The process stopped or the machine rebooted | Restart it. Section 7 of the Hosting Guide covers running it as a service so this does not happen. |
| The certificate has expired | A self-signed certificate lasts 90 days | Regenerate it and restart, or install a proper certificate. |
| You need yesterday's state back | You have a backup of the data directory | Stop the application, replace the directory with the backup, start it again. |
| An export looks wrong | Usually a filter or a misread column | Check the column headings against the Administrator Guide before assuming a fault. |
