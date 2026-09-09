# Clean second deployment

docs/06 Phase 7 acceptance: prove the Hosting Guide by performing a clean second deployment following only its written steps, then tear that deployment down.

Date: 2026-09-10, Melbourne. Path A (single host over HTTPS with the embedded database). Performed in a directory that had never held this project, from a fresh `git clone`, using only `guides/hosting-guide.md`.

Port 3543 and a data directory inside the fresh clone were used throughout so nothing touched the working deployment.

## What was run, and what it printed

### 3.1 Get the code and its dependencies

```
git clone https://github.com/carlraath/TestAutoCap.git
cd TestAutoCap
npm install
```

```
Cloning into 'TestAutoCap'...
added 623 packages in 19s
```

Node version checked first: `v24.14.1`, against the guide's stated minimum of 20.9.

### 3.2 Create the configuration

```
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

The generator produced a 43-character secret, exactly as the guide's table says. `.env` was then filled in per the table, with `APP_URL` and `PORT` set to this deployment's port.

### 3.3 Provide a certificate

```
npm run cert:dev
```

```
Wrote certs/dev-key.pem and certs/dev-cert.pem (self-signed, 90 days).
```

`certs/dev-key.pem` and `certs/dev-cert.pem` were both present afterwards.

### 3.4 Prepare the database and load the questions

```
mkdir -p data
npm run db:migrate
npm run db:seed
npm run db:load-bank -- bank/bank.v1.json --freeze
```

```
Database ready. Migrations applied (see schema_migrations).
Created administrator "admin" and recorded admin.bootstrap in the audit log.
Loaded <path>/bank/bank.v1.json: 65 inserted, 0 updated, bank version 1.
Bank version 1 frozen (settings bank_version, bank_frozen_at).
```

Every line matches what the guide says to expect, including the two-line bank load.

### 3.5 Build and start

```
npm run build
npm run start:https
```

```
Avec / Capability Placement listening on https://localhost:3543
```

## Section 5, verifying the deployment

| Step | Check | Result |
|---|---|---|
| 5.1 | The application answers | Sign-in page rendered, tab title "Avec / Capability Placement / Sign in". `01-login.png` |
| 5.2 | Health check | `{"ok":true,"time":"2026-09-09T22:13:22.088Z"}` |
| 5.3 | HTTPS and headers | `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` |
| 5.4 | The administrator can sign in | Signed in, landed on `/admin`. `02-overview.png` |
| 5.5 | Rotate the administrator password | "Password changed. Use the new password from your next sign in." The new password was then used to sign in again successfully. `04-password-rotated.png` |
| 5.6 | Create one test participant | Register shown with headers Participant code, Initial password, Allocated to. `03-register.png` |
| 5.7 | That participant can sign in | Signed in and saw all three assessment cards. `05-participant-dashboard.png` |
| 5.8 | No personal data | `PASS no personal-data columns in the schema.` |
| 5.9 | Times are Melbourne times | Audit log showed `10 Sep 2026, 08:15` against a machine clock of `Thu Sep 10 08:16 AUSEST`. Actions recorded: `admin.bootstrap`, `admin.password_rotated`, `participants.bulk_created`. `06-audit.png` |

## Section 10, teardown

```
npm run db:teardown
```

```
Refusing to delete anything without --yes. This removes every participant, attempt, item and audit row.
```

```
npm run db:teardown -- --yes
```

```
DELETION CONFIRMED 2026-09-09T22:16:27.197Z: embedded database directory
<path>/TestAutoCap/data/pglite removed and verified absent.
```

The data directory was then confirmed gone, the deployment directory including `.env` and `certs/` was removed, and the port stopped answering.

## The one deviation, and the fix

**`cp .env.example .env` failed: no such file.** `.gitignore` excluded `.env*`, which caught `.env.example` along with real environment files, so a fresh clone did not contain it and the guide's first configuration step could not be followed.

This is exactly the class of fault a second deployment exists to catch: the file was present in the working copy the whole time, so nothing local ever noticed. Fixed by adding `!.env.example` to `.gitignore` and committing the file, then re-cloning and continuing. Everything after that step ran as written.

## Notes

- The deployment was torn down and rebuilt once part-way through, because an early attempt rotated the administrator password before a scripted step failed on its own sign-out handling. The sequence above is a single clean pass on a database created from nothing.
- Path B (Vercel and Neon) was not exercised: it needs accounts only the owner can create. The guide marks it as not yet exercised and says to verify it on first use.
