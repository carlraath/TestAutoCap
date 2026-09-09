# Go-live checklist

Executed 2026-09-10 against the production HTTPS deployment.

```
1. Question bank loaded and frozen: version 1, Frozen 10 Sep 2026, 09:35..
   Sign-off record: bank/review/sign-off.md. Review document: bank/review/bank-review.md, all 65 items.
   Pilot completed and pilot attempts reset away: docs/evidence/pilot/pilot-log.md.
2. Administrator password rotated from the bootstrap value: confirmed on screen and audited as admin.password_rotated.
   The rotated password signs in; the bootstrap value no longer does.
3. 15 participants created. Allocation Register columns: PARTICIPANT CODE, INITIAL PASSWORD, ALLOCATED TO.
   Register downloaded once as allocation-register.csv. It is completed offline and never uploaded; no copy is kept in this repository.
   After a reload the register is gone from the screen: the passwords cannot be shown again.
4. HTTPS verified. Strict-Transport-Security: max-age=31536000; includeSubDomains. X-Frame-Options: DENY. Referrer-Policy: no-referrer.
   Session cookie cp_session: httpOnly true, secure true, sameSite Lax.
6. Times display in Melbourne time. Audit log shows "10 Sep 2026, 09:35"; the clock in Australia/Melbourne reads "10 Sep 2026, 09:35".
7. Practice reset: participant-01 started the test automation assessment.
   Reset performed with a typed reason; the assessment returned to Not started and the reset is in the audit log.
8. Practice export produced all four files: results.csv (3729 bytes), item-analysis.csv (5951 bytes), audit-log.csv (1571 bytes), archive.json (34222 bytes).
9. Rate limiting live: after ten failed attempts against participant-15 the correct password is refused, with the same generic message.
10. All four guides delivered and current: guides/participant-guide.md, administrator-guide.md, hosting-guide.md, operations-guide.md, each verified line by line against this build.
11. The no personal data verification is re-run against this production database immediately after this run; see docs/evidence/go-live/no-pii.txt.
```

## Line 5, the practice close and export, and clearing down

The four export files above were downloaded from the running deployment and are kept here as
evidence of their format. The no personal data verification was then re-run against the production
database and all four files (`no-pii.txt`): every one passed.

The practice data was then cleared, as the checklist requires:

```
DELETION CONFIRMED 2026-09-09T23:36:00.486Z: embedded database directory
C:\Projects\Test Automation Cap Build\data\production removed and verified absent.
```

## What the owner must repeat on the real deployment

Three lines of this checklist were rehearsed here with placeholder values and depend on the
owner's real secrets and real participants. They must be performed again on the production host:

1. Rotate the administrator password from whatever is set in the real deployment's configuration.
2. Create the real participants in one bulk creation.
3. Download the Allocation Register once, complete it offline, and never upload it anywhere.

Everything else on the checklist is a property of the build and holds wherever it is deployed.
