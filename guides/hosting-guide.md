# Hosting Guide

How to take Avec / Capability Placement from a clean machine to a live, HTTPS deployment, verify it, and tear it down afterwards with the data verifiably deleted.

The application holds no personal data of any kind. Participants exist only as numbered codes, and the code-to-person register is kept offline by the administrator. That is the security model, and it is why a free or near-free host is a defensible choice rather than a compromise.

## Contents

1. [What you need before you start](#1-what-you-need-before-you-start)
2. [Choosing a path](#2-choosing-a-path)
3. [Path A: single host over HTTPS (proven)](#3-path-a-single-host-over-https-proven)
4. [Path B: Vercel and Neon (managed)](#4-path-b-vercel-and-neon-managed)
5. [Verifying the deployment](#5-verifying-the-deployment)
6. [A custom web address](#6-a-custom-web-address)
7. [Keeping it running](#7-keeping-it-running)
8. [Backups](#8-backups)
9. [Costs](#9-costs)
10. [Teardown and data deletion](#10-teardown-and-data-deletion)
11. [Troubleshooting](#11-troubleshooting)

## 1. What you need before you start

| Requirement | Notes |
|---|---|
| Node.js 20.9 or newer | `node --version`. `package.json` requires `>=20.9.0`. Built and tested on Node 24. |
| git | To clone the repository. |
| A bash shell with an OpenSSL binary | Only for Path A with a self-signed certificate: `npm run cert:dev` runs `scripts/gen-cert.sh` through `bash`, and that script calls `openssl`. Git for Windows provides both; macOS and Linux already have them. |
| The repository | `https://github.com/carlraath/TestAutoCap.git` |
| A host | Your own machine or server for Path A, or accounts with Vercel and Neon for Path B. |

You do not need Docker, and you do not need to install PostgreSQL. Path A runs an embedded PostgreSQL inside the application process.

## 2. Choosing a path

**Path A, a single host over HTTPS.** One Node process serves the application and stores its data in a directory on disk. This is the path that was built, deployed and verified end to end for this project, and it is the recommended one. It runs unchanged on your own machine, on a small virtual machine, or on Railway, Render or Fly with a persistent volume attached.

**Path B, Vercel and Neon.** The managed combination docs/06 recommends. The application supports it: set `DATABASE_URL` and it uses managed PostgreSQL instead of the embedded one. Path B was written from the vendors' documentation and has not been exercised in this build, because it needs accounts that only the owner can create. Prove it on first use before real participants are created.

One caution on Path B: Vercel's Hobby tier is for non-commercial use under Vercel's own terms. For work delivered to a client, use a paid Vercel plan, or use Path A on Railway or Render, which costs a few dollars for a fortnight.

## 3. Path A: single host over HTTPS (proven)

Every command below is run from the repository root.

### 3.1 Get the code and its dependencies

```bash
git clone https://github.com/carlraath/TestAutoCap.git
cd TestAutoCap
npm install
```

Use a plain `npm install`, not `npm install --omit=dev`. Both the build and the HTTPS entry point run through `tsx`, which is a development dependency, so omitting development dependencies breaks `npm run build` and `npm run start:https`.

### 3.2 Create the configuration

Copy the example and then edit it:

```bash
cp .env.example .env
```

Generate a session secret and paste the output into `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

`.env` for Path A:

| Variable | Value | Why |
|---|---|---|
| `DATABASE_URL` | Leave empty | Empty means the embedded PostgreSQL is used. |
| `DATA_DIR` | `./data/pglite` | Where the database lives. On a host with a volume, point this at the volume. |
| `SESSION_SECRET` | The 43-character string you just generated | Signs and encrypts the session cookie. At least 32 characters. Anything shorter still lets the process start, but every page then returns a 500 and the log reads `SESSION_SECRET must be set to at least 32 characters. See .env.example.` |
| `ADMIN_USERNAME` | `admin` | The administrator's sign-in name. |
| `ADMIN_PASSWORD` | A strong password you choose | Used once, to create the administrator. Rotate it after first sign-in. |
| `APP_URL` | The address people will use, for example `https://placement.example.com` | Starting with `https` makes the session cookie Secure. |
| `PORT` | `3443` | The port the HTTPS server listens on. |
| `TLS_KEY_PATH` | `./certs/dev-key.pem` | Your private key. |
| `TLS_CERT_PATH` | `./certs/dev-cert.pem` | Your certificate. |

One further variable exists but is not in `.env.example` and is rarely needed: `HOST`, the interface the HTTPS server binds to. It defaults to `0.0.0.0`, which is what a host wants. Set it to `127.0.0.1` only if you are putting a reverse proxy in front on the same machine.

Never commit `.env`. It is already in `.gitignore`.

### 3.3 Provide a certificate

For a private network or a pilot, generate a self-signed certificate:

```bash
npm run cert:dev
```

OpenSSL prints its key-generation progress, then the script confirms:

```
Wrote certs/dev-key.pem and certs/dev-cert.pem (self-signed, 90 days).
```

The certificate is issued for `CN=localhost` with subject alternative names `DNS:localhost` and `IP:127.0.0.1`, and is valid for 90 days. Browsers will warn that the certificate is not trusted, which is acceptable for a pilot but not for real participants.

For real participants, use a certificate from a certificate authority. Obtain the key and certificate files, put them somewhere readable by the application, and point `TLS_KEY_PATH` and `TLS_CERT_PATH` at them. On Railway, Render and Fly, the platform terminates TLS for you: there, run `npm start` instead of `npm run start:https`, leave the TLS variables unset, and set `PORT` to the port the platform gives you.

### 3.4 Prepare the database and load the questions

The embedded database creates its own directory, but not the parent directory above it, and a fresh clone has no `data/` directory because it is git-ignored. Create it once:

```bash
mkdir -p data
```

Then:

```bash
npm run db:migrate
npm run db:seed
npm run db:load-bank -- bank/bank.v1.json --freeze
```

Expect, in order:

```
Database ready. Migrations applied (see schema_migrations).
Created administrator "admin" and recorded admin.bootstrap in the audit log.
Loaded <absolute path>/bank/bank.v1.json: 65 inserted, 0 updated, bank version 1.
Bank version 1 frozen (settings bank_version, bank_frozen_at).
```

The bank load prints two lines: the load summary and the freeze confirmation.

All three commands are safe to run again. The seed says `Administrator "admin" already exists. Nothing changed.` on a second run, and a second bank load reports `0 inserted, 65 updated` and leaves the version at 1.

`--freeze` records the bank version that every attempt is served from and stamps the time it was frozen. Freeze once, before the first real participant starts.

### 3.5 Build and start

```bash
npm run build
npm run start:https
```

The last command prints:

```
Avec / Capability Placement listening on https://localhost:3443
```

The port in that line is whatever `PORT` is set to. Leave it running. Section 7 covers running it as a service so it survives a reboot.

## 4. Path B: Vercel and Neon (managed)

Written from the vendors' documentation and **not yet exercised on this build**. Verify each step the first time you use it, before any real participant is created.

### 4.1 The database

1. Create a Neon account and a project. Choose the region closest to your participants.
2. Copy the **pooled** connection string. It looks like `postgresql://user:password@ep-something-pooler.region.aws.neon.tech/neondb?sslmode=require`. The pooled endpoint matters, because serverless functions open many short-lived connections.

### 4.2 The application

1. Create a Vercel account and import the GitHub repository. Vercel detects Next.js and needs no build configuration.
2. Add these environment variables in the Vercel project settings, for the Production environment:

| Variable | Value |
|---|---|
| `DATABASE_URL` | The pooled Neon connection string |
| `SESSION_SECRET` | A fresh 32-character-or-longer random string |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | A strong password you choose |
| `APP_URL` | The deployment address, for example `https://your-project.vercel.app` |

Do not set `DATA_DIR`, `PORT`, `TLS_KEY_PATH` or `TLS_CERT_PATH` on Vercel.

3. Deploy.

### 4.3 Seed and load from your own machine

The seed and bank load are one-off commands. Run them locally against the managed database:

```bash
DATABASE_URL="<the pooled connection string>" npm run db:migrate
DATABASE_URL="<the pooled connection string>" npm run db:seed
DATABASE_URL="<the pooled connection string>" npm run db:load-bank -- bank/bank.v1.json --freeze
```

On Windows PowerShell the `VAR=value command` prefix does not exist; set the variable first with `$env:DATABASE_URL = "..."` and then run each command on its own line.

Migrations also run automatically the first time the application opens the database, so `db:migrate` is belt and braces.

Then continue to section 5.

## 5. Verifying the deployment

Do all of these before telling anyone the address. The `curl` examples use the default port, `3443`; use whatever you set `PORT` to.

1. **The application answers.** Open `APP_URL` in a browser. The root address redirects to `/login`, and you should land on the sign-in page: the Avec logo and the heading Capability Placement on a card, over the brand gradient. On Path A with a self-signed certificate you will pass a browser warning first.
2. **Health check.**
   ```bash
   curl -k https://localhost:3443/api/health
   ```
   returns `{"ok":true,"time":"..."}`, with the time as an ISO 8601 UTC instant.
3. **HTTPS and headers.**
   ```bash
   curl -kI https://localhost:3443/
   ```
   shows `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and `Permissions-Policy`, on a 307 redirect to `/login`.
4. **The administrator can sign in.** The sign-in form has one identity field, labelled Participant code; the administrator uses it too. Enter `ADMIN_USERNAME` and `ADMIN_PASSWORD` and select Sign in. You land on Overview, with the administration navigation: Overview, Participants, Results, Statistics, Demand, Items, Audit, Export, Account.
5. **Rotate the administrator password.** Go to Account, enter the current password and the new one twice (at least 12 characters), and select Change password. The bootstrap password from `.env` must not remain in use.
6. **Create one test participant.** Go to Participants. On the Create participants card, set How many to 1 and select Create participants. The Allocation Register appears once, with the columns Participant code, Initial password and Allocated to, and one row. Select Download CSV; the file is saved as `allocation-register.csv` and holds those three headers and the one row, with Allocated to left empty for you to complete offline.
7. **That participant can sign in.** Sign out, then sign in with the code and password from the register. You should see the three assessment cards: Test Automation Fundamentals, SQL and Python.
8. **No personal data.**
   ```bash
   npm run verify:no-pii
   ```
   prints `Schema: 62 columns inspected.`, then every column, and ends with `PASS no personal-data columns in the schema.` It reads the same database the application is using and is safe to run while the application is running.
9. **Times are Melbourne times.** Any timestamp in the administrator's screens should match Australia/Melbourne local time. Instants are stored in UTC and displayed in Melbourne time.
10. **Remove the test participant's attempts** if it started one: on the Participants screen select Reset in that assessment's column, type a reason, and confirm with Reset attempt. Note the code so it is not confused with a real participant. There is no delete: the test participant simply goes unallocated in the offline register.

## 6. A custom web address

Optional. Participants can use the default address perfectly well.

**Path A.** Create a DNS A record pointing your chosen name at the server's public address. Obtain a certificate for that name, point `TLS_KEY_PATH` and `TLS_CERT_PATH` at it, set `APP_URL` to `https://that-name`, and restart.

**Path B.** Add the domain in the Vercel project's Domains settings, create the DNS record Vercel shows you, and update `APP_URL` to match. Vercel issues the certificate.

Update `APP_URL` whenever the address changes. It is what decides whether the session cookie carries the Secure attribute, and a mismatch presents as participants being returned to the sign-in page over and over.

## 7. Keeping it running

The application must survive a reboot for the live week.

**Linux with systemd.** Create `/etc/systemd/system/capability-placement.service`:

```
[Unit]
Description=Avec Capability Placement
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/TestAutoCap
ExecStart=/usr/bin/npm run start:https
Restart=always
User=capability
EnvironmentFile=/opt/TestAutoCap/.env

[Install]
WantedBy=multi-user.target
```

Check that `/usr/bin/npm` is where npm actually is on your host (`which npm`) and that the `capability` user can read the repository, `.env` and the certificate files. Then `sudo systemctl enable --now capability-placement`.

**Windows.** Create a Task Scheduler task that runs `npm run start:https` in the repository directory, triggered At startup, with Run whether user is logged on or not.

**Railway, Render or Fly.** The platform restarts the process for you. Attach a persistent volume, set `DATA_DIR` to a path on that volume, and use `npm start` because the platform terminates TLS.

## 8. Backups

The whole database is the `DATA_DIR` directory on Path A. To back it up, stop the application, copy the directory, and start it again:

```bash
# stop the process first
mkdir -p backups
cp -r ./data/pglite ./backups/pglite-$(date +%Y%m%d)
# start it again
```

The `mkdir` matters: `cp -r` will not create the missing `backups` parent for you.

Copying it while the application is running can capture a half-written state. During a one-week exercise, a copy at the end of each day is ample.

On Path B, Neon keeps its own point-in-time history; nothing further is needed.

## 9. Costs

| Path | Cost | Notes |
|---|---|---|
| Path A on your own machine or an existing server | Nothing | No new accounts. |
| Path A on Railway or Render with a small volume | A few dollars for a fortnight | Both bill by usage on their lowest tiers. |
| Path B, Neon free tier | Nothing | Ample for 15 participants. |
| Path B, Vercel Hobby | Nothing | Non-commercial use only under Vercel's terms. |
| Path B, Vercel Pro | About twenty US dollars a month | Needed if the deployment is commercial. |

The cost target in docs/06 is zero on free tiers with a ceiling of a few dollars for the live fortnight. Path A on your own hardware and Path B on Neon plus a non-commercial Vercel project both meet it. Record what you actually spent here when the exercise closes.

Actual cost for this build: nothing. It was built and verified on Path A on the owner's own machine.

## 10. Teardown and data deletion

Do this once the exports are handed over and the owner has confirmed receipt. It is irreversible.

Stop the application first, so nothing can write the database back after the deletion. Then:

```bash
npm run db:teardown -- --yes
```

Without `--yes` it refuses, changes nothing, and exits with status 2:

```
Refusing to delete anything without --yes. This removes every participant, attempt, item and audit row.
```

With `--yes` on Path A it removes the data directory, checks it is gone, and prints a line you can quote to the owner:

```
DELETION CONFIRMED 2026-09-09T21:49:24.132Z: embedded database directory C:\...\data\pglite removed and verified absent.
```

On Path B it drops every application table, confirms none remain, and tells you to delete the Neon database itself and revoke its credentials.

Then finish the job:

1. Remove the service or scheduled task, so nothing restarts the application.
2. Path A: delete the repository directory from the server, including `.env` and `certs/`.
3. Path B: delete the Vercel project and the Neon project.
4. Delete any copy of the Allocation Register from anywhere it should not be. It should only ever have existed offline, with the owner.
5. Send the owner the written deletion confirmation. The Operations Guide has the wording.

## 11. Troubleshooting

| Symptom | Cause | What to do |
|---|---|---|
| The server starts, but every page returns 500 and the log reads `SESSION_SECRET must be set to at least 32 characters` | `SESSION_SECRET` is missing or shorter than 32 characters | Generate one with the command in 3.2, put it in `.env`, and restart. |
| `ENOENT: no such file or directory, mkdir ...\data\pglite` on `db:migrate` | The parent of `DATA_DIR` does not exist; the embedded database creates only the final directory | Create it first, as in 3.4: `mkdir -p data`. On a platform host, make sure the volume is mounted before the process starts. |
| `TLS file not found` | `npm run cert:dev` was not run, or the paths are wrong | Run it, or correct `TLS_KEY_PATH` and `TLS_CERT_PATH`. |
| `npm run cert:dev` fails on Windows | No bash or no OpenSSL on the path | Run it from Git Bash, which supplies both. |
| Browser warns the certificate is not trusted | Self-signed certificate | Expected on a pilot. Use a real certificate for participants. |
| Sign-in fails with the correct password | Ten failed attempts within fifteen minutes triggered the rate limit | Wait fifteen minutes. The limit applies per account and per address. |
| A participant cannot start an assessment, and the server log or API response shows `no_bank` | The bank was never loaded or frozen | Run the `db:load-bank` command with `--freeze`. |
| A participant sees the sign-in page repeatedly | `APP_URL` starts with `https` but the site is served over plain HTTP, so the Secure cookie is dropped | Make `APP_URL` match the address people actually use. |
| Port already in use | Another copy is running | Stop it, or change `PORT`. |
| Data missing after a restart on a platform host | `DATA_DIR` is not on a persistent volume | Point it at the volume and redeploy. |
| `npm run build` or `npm run start:https` fails with a missing `tsx` or `next` | Dependencies installed with `--omit=dev` | Reinstall with a plain `npm install`. |
