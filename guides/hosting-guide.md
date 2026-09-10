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

**Path B, Vercel and Neon.** The managed combination docs/06 recommends. The application supports it: set `DATABASE_URL` and it uses managed PostgreSQL instead of the embedded one. Path B was written from the vendors' documentation, and no Neon account existed while it was written, so it has not been run end to end against a real Neon database. Section 4 says exactly which parts have been tested and which have not. Prove it on first use, before any real participant is created.

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
| `ADMIN_PASSWORD` | A strong password you choose, at least 12 characters | Used once, to create the administrator. Rotate it after first sign-in. |
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

```bash
npm run db:migrate
npm run db:seed
npm run db:load-bank -- bank/bank.v1.json --freeze
```

The `data/` directory is created for you if it is not there.

Every one of these commands begins by saying which database it is about to use. On Path A that line reads:

```
Using embedded PGlite database in <absolute path>\data\pglite on this machine.
```

Then, in order:

```
Database ready. Migrations applied (see schema_migrations).
Migrations in place: 0001_init.
Created administrator "admin" and recorded admin.bootstrap in the audit log.
Loaded <absolute path>\bank\bank.v1.json: 65 inserted, 0 updated, bank version 1.
Bank version 1 frozen (settings bank_version, bank_frozen_at).
```

The bank load prints two lines: the load summary and the freeze confirmation.

Each command finishes and gives you the prompt back. If a command ever stops at a blank line and stays there, it has not failed silently: stop it with Ctrl+C and report it.

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

**What has been tested, and what has not.** No Neon account existed while this was built, so the steps below have not been run end to end against a real Neon database. What has been tested, from a Windows machine, is everything up to the point where the commands leave this machine: with a Neon-shaped connection string set, all three commands in 4.3 correctly read it, announce the Neon host they are about to use and set the connection to be encrypted with the certificate checked, and each of the likely mistakes in the connection string produces a short plain-English message instead of a stack trace. What has not been tested is anything that needs a real Neon database at the other end: the connection itself, creating the tables, creating the administrator and loading the questions have only ever been run against the embedded database. They are the same code either way, and they are safe to run more than once, but treat the first run of 4.3 as the moment Path B is proven. Do it before any real participant is created, and read the output rather than assuming it worked.

### 4.1 The database

1. Create a Neon account and a project. Choose the region closest to your participants.
2. Copy the **pooled** connection string. It looks like `postgresql://user:password@ep-something-pooler.region.aws.neon.tech/neondb?sslmode=require`. The pooled endpoint matters, because serverless functions open many short-lived connections.
3. **Treat that string as a password**, because it contains one. It is enough on its own for anyone who has it to read and change the database. Do not paste it into a chat, an email, a support ticket, a document, a screenshot or anywhere public. Keep it in your password manager. You will need it again in 4.3, and you can always copy it afresh from the Neon dashboard: open your project, go to Connection Details, choose the pooled connection, and reveal the password so the string is copied in full rather than as dots.

### 4.2 The application

1. Create a Vercel account and import the GitHub repository. Vercel detects Next.js and needs no build configuration.
2. Add these environment variables in the Vercel project settings, for the Production environment:

| Variable | Value |
|---|---|
| `DATABASE_URL` | The pooled Neon connection string |
| `SESSION_SECRET` | A fresh 32-character-or-longer random string |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | A strong password you choose, at least 12 characters |
| `APP_URL` | The deployment address, for example `https://your-project.vercel.app` |

Do not set `DATA_DIR`, `PORT`, `TLS_KEY_PATH` or `TLS_CERT_PATH` on Vercel. You do not need `DATABASE_SSL` either: a hosted database is encrypted with its certificate checked unless you say otherwise.

One thing to know about `ADMIN_PASSWORD`. The running website never uses it. The administrator account is created once, by the seed command in 4.3, and the password that will actually sign you in is the one that command sees. Keeping the same value in Vercel is worth doing so there is a single record of it, but changing it in Vercel later changes nothing: to change the administrator password, sign in and use the Account screen.

3. Deploy.

**If you add or change an environment variable after a deployment, that deployment does not pick it up.** Vercel bakes the variables in when it builds. Go to the Deployments tab, open the most recent deployment, and choose Redeploy. Section 4.4 comes back to this.

### 4.3 Fill the database from your own computer

#### What this step is, and why it does not happen on Vercel

At this point Neon has an empty database and Vercel has a website that expects a full one. This step fills it.

You do it on your own computer, in a text window called PowerShell, not on Vercel. That is not a workaround; it is the shape of the job. Vercel's job is to serve the website to participants, over and over, for a week. These are three one-off commands that each run once, do their work and stop: create the tables, create the administrator account, load the 65 questions. There is nowhere on Vercel to type a one-off command, so you type it here, and it reaches across the internet to the same Neon database that the website uses.

You will use PowerShell for about five minutes and then close it. Nothing new is installed and nothing is left running.

#### Before you start

You need three things to hand:

| What | Where it comes from |
|---|---|
| The pooled Neon connection string | The one from 4.1. Copy it from your password manager, or afresh from the Neon dashboard. |
| The administrator password | The one you put in Vercel as `ADMIN_PASSWORD` in 4.2. At least 12 characters. |
| The repository on this computer, with its dependencies installed | A copy of the repository in a folder on this machine, with `npm install` already run in it once. Section 1 lists what that needs. Vercel building the site from GitHub does not give you this: it is a separate copy, on Vercel. |

Both the connection string and the administrator password are secrets. They will be visible on screen while you work, so do not do this on a shared screen or while screen-sharing.

#### Step 1: open PowerShell in the right folder

Select the Start button, type `powershell`, and open **Windows PowerShell**. Take that entry and no other: Command Prompt, and anything called `cmd`, will not understand the lines in Step 2. A window opens with a line of text ending in `>`, waiting for you to type. That line is called the prompt.

Every command below is typed at the prompt and run by pressing Enter. You can paste with Ctrl+V or by right-clicking.

First, move the window to the folder the application lives in. Type this and press Enter.

```powershell
cd "C:\Projects\Test Automation Cap Build"
```

The prompt should now end with `C:\Projects\Test Automation Cap Build>`. If instead you see a message saying the path does not exist, the repository is somewhere else on this machine; find the folder in File Explorer, copy its address from the address bar, and use that between the quotes.

#### Step 2: tell this window which database to use

This is the step everything else depends on. Type the line below, but replace the words between the quotes with your pooled Neon connection string. Keep the straight double quotes that are already there and paste the string between them; do not add quotes of your own, and do not remove the `?sslmode=require` at the end, or the `&channel_binding=require` after it if your string has one.

**One trap, and it is silent.** Between double quotes, PowerShell treats a dollar sign and a backtick as instructions rather than characters, and quietly throws away part of what you pasted: `"Avec$Placement2026!"` becomes `Avec!`. If the connection string or the password you are about to paste contains a `$` or a `` ` ``, use single quotes instead of double quotes on that line, so `$env:ADMIN_PASSWORD = 'Avec$Placement2026!'`. Single quotes take the value exactly as written. If the value contains an apostrophe as well, choose a value without one; it is easier than the escaping.

```powershell
$env:DATABASE_URL = "postgresql://neondb_owner:PASSWORD@ep-something-pooler.region.aws.neon.tech/neondb?sslmode=require"
```

Nothing is printed. PowerShell simply returns you to the prompt, which means it worked.

Now the administrator's sign-in name:

```powershell
$env:ADMIN_USERNAME = "admin"
```

And the administrator's password. Replace the placeholder between the quotes with the password you put in Vercel; do not run the line as it stands, or the administrator will be created with the placeholder as its password.

```powershell
$env:ADMIN_PASSWORD = "PASTE-THE-VERCEL-ADMIN-PASSWORD-HERE"
```

Again, neither prints anything.

**Three things about these three lines.**

They last only as long as this window is open. Close it, or open a second window, and they are gone. That is why all three commands below must be run in this same window, one after another, without closing it in between.

They are also why the commands reach Neon at all. This folder contains a file called `.env` left over from the Path A build, and it holds a database setting and an administrator password of its own. Anything you set in this window overrides that file. If you skip Step 2, the commands quietly use the file instead: the tables get built on this computer, the administrator gets the file's password, and Neon stays empty while every command reports success. Step 3 tells you how to spot that in one line.

And they are most of how you clean up: close the window and they are gone. Step 6 covers that, and the one thing closing the window does not clear.

#### Step 3: create the tables

This creates the empty tables the application needs. It changes nothing that already exists, and it is safe to run as many times as you like.

```powershell
npm run db:migrate
```

You should see this, allowing for your own Neon host name, region, database and user in the line beginning `Using`:

```
> avec-capability-placement@0.1.0 db:migrate
> tsx scripts/migrate.ts

Using managed PostgreSQL at ep-something-pooler.region.aws.neon.tech:5432, database "neondb", user "neondb_owner", TLS, certificate checked.
Database ready. Migrations applied (see schema_migrations).
Migrations in place: 0001_init.
```

The first two lines, the ones beginning with `>`, are npm announcing what it is about to run. Every `npm run` command in this section starts with a pair like that, followed by a blank line. Ignore them.

**The line that matters is the one beginning `Using`.** Every one of these commands says which database it is about to touch before it touches it. It must name your Neon host. If it instead says

```
Using embedded PGlite database in C:\Projects\Test Automation Cap Build\data\production on this machine.
```

naming a folder on this computer rather than a Neon host (the folder itself depends on what your `.env` file says, so it may end `data\pglite` instead), then `DATABASE_URL` is not set in this window, and you have just built a throwaway database on your own computer while Neon stayed empty. Nothing is broken and nothing is lost. Go back to Step 2, set the connection string again in this same window, and run this command again.

Then you are returned to the prompt. If a command ever stops at a blank line and stays there for more than a minute, press Ctrl+C to stop it and see the failures below.

#### Step 4: create the administrator

This creates the one administrator account, using the name and password you set in Step 2, and records the fact in the audit log.

```powershell
npm run db:seed
```

You should see the same `Using managed PostgreSQL at ...` line, then:

```
Created administrator "admin" and recorded admin.bootstrap in the audit log.
```

If you run it a second time it will not create a second account or change the password. It says `Administrator "admin" already exists. Nothing changed.` and stops. That also means that if you have already seeded this database with the wrong password, running the seed again with the right one will not fix it: sign in with the password that was used the first time and change it on the Account screen.

#### Step 5: load the questions and freeze the bank

This loads the 65 questions and records which version of the question bank every attempt will be served from. Type it exactly as it appears, including the two dashes standing on their own.

```powershell
npm run db:load-bank -- bank/bank.v1.json --freeze
```

You should see the `Using managed PostgreSQL at ...` line and then two lines:

```
Loaded C:\Projects\Test Automation Cap Build\bank\bank.v1.json: 65 inserted, 0 updated, bank version 1.
Bank version 1 frozen (settings bank_version, bank_frozen_at).
```

`65 inserted` is what a first load looks like. If you run it again it reports `0 inserted, 65 updated` and leaves the version at 1, which is also fine. Freeze once, before the first real participant starts.

#### Step 6: close the window

That is the database filled. Close the PowerShell window with the X in its corner, or by typing `exit` and pressing Enter. The settings themselves go with it: they were only ever held in that window.

If you would rather keep the window open for the checks in 4.4, clear the two secrets from it instead:

```powershell
Remove-Item Env:\DATABASE_URL, Env:\ADMIN_PASSWORD -ErrorAction SilentlyContinue
```

The `-ErrorAction SilentlyContinue` on the end only stops PowerShell printing a red complaint if you run the line twice, or if one of the two was never set.

**One thing closing the window does not clean up.** PowerShell keeps a plain-text record of every line you type, in a file that outlives the window:

```
C:\Users\<your user name>\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

The two lines from Step 2 are in it, with the Neon password and the administrator password readable in full. Before you finish, delete those lines. Paste this into the PowerShell window and press Enter:

```powershell
notepad (Get-PSReadLineOption).HistorySavePath
```

Notepad opens the file. Delete every line beginning `$env:DATABASE_URL` or `$env:ADMIN_PASSWORD`, save with Ctrl+S and close Notepad. Deleting the whole contents is fine too: it is only a list of commands you have typed. If Notepad says the file does not exist, there is nothing to clean up.

#### If something goes wrong

When one of the three commands fails it prints a short block that begins `Could not use the database.`, names the database it tried, says what went wrong and says what to do. It looks like this, and the messages below are the real ones, recorded from the application:

```
Could not use the database.

  Target:  managed PostgreSQL at ep-something-pooler.region.aws.neon.tech:5432, database "neondb", user "neondb_owner", TLS, certificate checked
  Problem: The database host "ep-something-pooler.region.aws.neon.tech" could not be found on the internet.
  Do this: There is almost certainly a typo in DATABASE_URL, or it was not pasted in full. Copy the connection string again from your database provider's dashboard and set it again, then run the command again. If the host name is right, check this machine's internet connection.

  Technical detail: getaddrinfo ENOTFOUND ep-something-pooler.region.aws.neon.tech
```

Read the `Problem` and `Do this` lines and act on them. These are the ones you are most likely to meet.

| What you see | What has happened | What to do |
|---|---|---|
| `Using embedded PGlite database in ... on this machine.` where you expected your Neon host | `DATABASE_URL` is not set in this window. Either Step 2 was skipped, or this is a different window from the one you set it in | Do Step 2 again in this window and run the command again. Nothing reached Neon, and nothing was lost. |
| `Problem: The database host "..." could not be found on the internet.` | The connection string was cut short when it was copied, or has a typo in the host name | Copy the whole string again from the Neon dashboard, do Step 2 again, and run the command again. Check the very end of it in particular: these strings are long and easy to truncate. |
| `Problem: The database at ... refused the user name or password in DATABASE_URL.` | The password inside the string is wrong, usually because it was copied while Neon was showing it as dots | In Neon, reveal the password, copy the whole connection string, and do Step 2 again. If it still refuses and your string ends with `&channel_binding=require`, delete that part and try once more. The message tells you this too. |
| `DATABASE_URL is not a connection string I can read: ...` | Something other than a connection string was pasted, or extra characters came with it | Paste only the string itself, starting `postgresql://`, between the quotes. Wrapping quotes, stray spaces and a leading `psql ` are removed for you, so if you still see this, what was pasted is not a connection string. |
| `DATABASE_URL is not set, but POSTGRES_URL is.` | The variable name was mistyped in Step 2 | The command refused to run rather than quietly build a database on your computer. Set it as `DATABASE_URL`, exactly, and run the command again. |
| `Technical detail: ADMIN_PASSWORD must be at least 12 characters.` on the seed | The administrator password is too short | Choose a longer one, set it in Vercel as well so the two match, do Step 2 again with the new one, and run the seed again. |
| `There is no question bank file at ...` on the bank load | The file name after the command was mistyped | It is `bank/bank.v1.json`, with forward slashes. Copy the command from Step 5 exactly. |
| A message that `npm` is not recognized as the name of a cmdlet (PowerShell spells it the American way) | Node.js is not installed on this machine, or not on this account's path | Install Node.js 20.9 or newer from nodejs.org, close the PowerShell window, open a new one and start again at Step 1. |
| `'tsx' is not recognized as an internal or external command`, after the two `>` lines | The repository on this computer has never had `npm install` run in it, so the tools the commands need are missing | Run `npm install` once in this folder, wait for it to finish, and run the command again. |
| `npm error Missing script: "db:migrate"`, or a complaint about no `package.json` | The window is not in the repository folder | Do Step 1 again, and check the prompt ends with the repository folder before going on. |

If a message means nothing to you, turn on the full technical detail and try once more. In the same window, run this line first:

```powershell
$env:DEBUG_DB = "1"
```

It prints nothing. Then run the command that failed again, exactly as before. It will print the same plain-English block and a much longer technical trace after it. Send that, and the command you ran, to whoever is helping, having first checked that your connection string and password are not in what you are sending.

### 4.4 Check it worked, and redeploy if you need to

**First, redeploy if you need to.** If you added or changed any environment variable in Vercel after your last deployment, the live site is still running with the old ones. In Vercel, open the Deployments tab, open the most recent deployment, and choose Redeploy. Wait for it to finish before going on.

Then check the site properly, in this order.

1. **Open your Vercel address** in a browser, the same one you put in `APP_URL`. The address should take you to a sign-in page: the Avec logo and the heading Capability Placement, on a card over the brand gradient.
2. **Sign in as the administrator.** The form has one identity field labelled Participant code; the administrator uses it too. Enter `admin` and the administrator password you set in Step 2 of 4.3. You should land on the Overview screen, with the administration navigation across it: Overview, Participants, Results, Statistics, Demand, Items, Audit, Export, Account.
3. **Confirm the questions are there.** Go to Items. You should see the Item analysis screen with a table of items. If it says **No question bank loaded** instead, the bank load did not reach this database. If you would rather see it from a participant's side, create one test participant on the Participants screen and sign in as them: you should see the three assessment cards, Test Automation Fundamentals, SQL and Python. Section 5 walks through that properly.

If any of that goes wrong, here is what it means.

| What you see | What it means | What to do |
|---|---|---|
| An error page, or a page that will not load, before you can even sign in | The website cannot reach the database | Open `https://your-project.vercel.app/api/health` in the browser. `{"ok":true,...}` means the database is fine and the problem is elsewhere. Anything else means it is not: check that `DATABASE_URL` in Vercel is the same pooled string you used in 4.3, and that you have redeployed since setting it. Opening that address also writes the reason into Vercel's Logs tab, as the same plain-English `Could not use the database.` block that PowerShell would have shown you. |
| The sign-in page appears, but `admin` and your password are rejected | The account was created with a different password. Almost always this is 4.3 Step 2 having been skipped, so the seed used the password in the `.env` file on your computer rather than yours | Changing `ADMIN_PASSWORD` in Vercel will not help; the running site never reads it. If nobody has used the system yet, the clean fix is to empty the database and start 4.3 again: in Neon, delete the project's database and create it fresh, then run 4.3 from Step 1 with `DATABASE_URL` set. |
| You sign in, but Items says **No question bank loaded**, or a participant sees no assessments and the log mentions `no_bank` | The bank load in 4.3 Step 5 did not run, or ran against a database on your own computer | Run 4.3 again from Step 1, watching the `Using` line, and finish with Step 5. |
| You are returned to the sign-in page each time you sign in | `APP_URL` does not match the address you are actually using | Set `APP_URL` in Vercel to exactly the address in the browser's address bar, then redeploy. |

Once you can sign in and see Overview, Path B is proven on this deployment. Go on to section 5 and do the rest of the checks before you give the address to anybody.

## 5. Verifying the deployment

Do all of these before telling anyone the address. The `curl` examples use the default port, `3443`; use whatever you set `PORT` to. They assume a bash shell. In Windows PowerShell, `curl` is not curl at all but an alias for a different tool, and the `-k` and `-I` flags make it fail: use `curl.exe` in place of `curl`, or follow the Path B alternative given under each one.

1. **The application answers.** Open `APP_URL` in a browser. The root address redirects to `/login`, and you should land on the sign-in page: the Avec logo and the heading Capability Placement on a card, over the brand gradient. On Path A with a self-signed certificate you will pass a browser warning first.
2. **Health check.**
   ```bash
   curl -k https://localhost:3443/api/health
   ```
   returns `{"ok":true,"time":"..."}`, with the time as an ISO 8601 UTC instant. On Path B, open `APP_URL` followed by `/api/health` in a browser instead.
3. **HTTPS and headers.**
   ```bash
   curl -kI https://localhost:3443/
   ```
   shows `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and `Permissions-Policy`, on a 307 redirect to `/login`. On Path B, open your Vercel address in a browser instead, press F12 for the developer tools, open the Network tab, reload the page, select the first entry in the list and read its response headers: the same headers should be there.
4. **The administrator can sign in.** The sign-in form has one identity field, labelled Participant code; the administrator uses it too. Enter `ADMIN_USERNAME` and `ADMIN_PASSWORD` and select Sign in. You land on Overview, with the administration navigation: Overview, Participants, Results, Statistics, Demand, Items, Audit, Export, Account.
5. **Rotate the administrator password.** Go to Account, enter the current password and the new one twice (at least 12 characters), and select Change password. The bootstrap password must not remain in use.
6. **Create one test participant.** Go to Participants. On the Create participants card, set How many to 1 and select Create participants. The Allocation Register appears once, with the columns Participant code, Initial password and Allocated to, and one row. Select Download CSV; the file is saved as `allocation-register.csv` and holds those three headers and the one row, with Allocated to left empty for you to complete offline.
7. **That participant can sign in.** Sign out, then sign in with the code and password from the register. You should see the three assessment cards: Test Automation Fundamentals, SQL and Python.
8. **No personal data.**
   ```bash
   npm run verify:no-pii
   ```
   names the database it is reading, prints `Schema: 62 columns inspected.`, then every column, and ends with `PASS no personal-data columns in the schema.` On Path B, set `$env:DATABASE_URL` in that window first, exactly as in 4.3 Step 2, or it will inspect a database on your own machine instead. It reads the same database the application is using and is safe to run while the application is running.
9. **Times are Melbourne times.** Any timestamp in the administrator's screens should match Australia/Melbourne local time. Instants are stored in UTC and displayed in Melbourne time.
10. **Remove the test participant's attempts** if it started one: on the Participants screen select Reset in that assessment's column, type a reason, and confirm with Reset attempt. Note the code so it is not confused with a real participant. There is no delete: the test participant simply goes unallocated in the offline register.

## 6. A custom web address

Optional. Participants can use the default address perfectly well.

**Path A.** Create a DNS A record pointing your chosen name at the server's public address. Obtain a certificate for that name, point `TLS_KEY_PATH` and `TLS_CERT_PATH` at it, set `APP_URL` to `https://that-name`, and restart.

**Path B.** Add the domain in the Vercel project's Domains settings, create the DNS record Vercel shows you, and update `APP_URL` to match, then redeploy so the new value takes effect. Vercel issues the certificate.

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

**Vercel.** Nothing to do. There is no process of yours to keep alive, and no PowerShell window to leave open: the window in 4.3 was only ever needed for those three one-off commands.

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

Stop the application first, so nothing can write the database back after the deletion. On Path B that means the deployment: pause or delete the Vercel project, so no visitor can create anything after the wipe.

Then, on Path A:

```bash
npm run db:teardown -- --yes
```

On Path B, run it from PowerShell in the same way as 4.3: open a window, `cd` to the folder, set `$env:DATABASE_URL` to the pooled connection string, and then:

```powershell
npm run db:teardown -- --yes
```

Check the `Using` line names your Neon host before you let it finish, for the same reason as in 4.3.

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
| The server starts, but every page returns 500 and the log reads `SESSION_SECRET must be set to at least 32 characters` | `SESSION_SECRET` is missing or shorter than 32 characters | Generate one with the command in 3.2, put it in `.env`, and restart. On Vercel, set it in the project settings and redeploy. |
| `ENOENT: no such file or directory, mkdir ...\data\pglite` on `db:migrate` | `DATA_DIR` points somewhere that cannot be created | The commands create `DATA_DIR` themselves, including the folders above it, so this means the path is wrong or not writable. On a platform host, make sure the volume is mounted before the process starts. |
| A database command says `Using embedded PGlite database in ... on this machine` when you meant to use Neon | `DATABASE_URL` is not set in this window. PowerShell variables set with `$env:` are lost when the window closes | Set `$env:DATABASE_URL` again in this window, as in 4.3 Step 2, and run the command again. Nothing was written to Neon. |
| `The database host "..." could not be found on the internet` | A typo in `DATABASE_URL`, or it was not pasted in full | Copy the connection string from the Neon dashboard again and set it again. Check the very end of it: connection strings are long and easy to truncate. |
| `The database ... refused the user name or password in DATABASE_URL` | The password inside the connection string is wrong, usually because the string was pasted from an old copy or reveals as dots | In Neon, show the password in full, copy the whole connection string, and set `DATABASE_URL` again. If the string ends with `&channel_binding=require`, remove that part and try once more. |
| `The database ... requires an encrypted connection` | The connection string has no `sslmode` and the provider insists on TLS | Add `?sslmode=require` to the end of `DATABASE_URL`, or set `DATABASE_SSL=require`. |
| `The encryption certificate presented by ... could not be checked` | The provider uses its own certificate authority rather than a public one | Check the host name first. If it is right, set `DATABASE_SSL=no-verify`, which keeps the connection encrypted but stops checking the certificate. |
| `The sslmode in DATABASE_URL is set to "..." which is not a value I understand` | The connection string was edited by hand | Use `sslmode=require`, which is what Neon supplies, and set `DATABASE_URL` again. |
| `DATABASE_URL is not set, but POSTGRES_URL is` | The connection string was set under the wrong variable name | Set it as `DATABASE_URL`. The command refuses to run rather than quietly build a database on your own machine. |
| `DATABASE_URL is not a connection string I can read` | Something other than a connection string, or extra characters around it | Paste only the connection string, starting `postgresql://`, between the quotes in the example in 4.3 Step 2. |
| `Technical detail: ADMIN_PASSWORD must be at least 12 characters.` on `db:seed` | The administrator password is too short | Choose a longer one, keep Vercel's copy in step, set it again and run the seed again. |
| The administrator password from Vercel does not sign you in on Path B | The account was created by `db:seed` with whatever password that command saw. If `$env:ADMIN_PASSWORD` was not set, that was the value in the `.env` file on your own machine | Changing it in Vercel has no effect; the site never reads it. Sign in with the password that was used at seed time and change it on the Account screen, or empty the Neon database and run 4.3 again from Step 1. |
| A message that `npm` is not recognized as the name of a cmdlet | Node.js is not installed, or not on this account's path | Install Node.js 20.9 or newer, then open a new PowerShell window so it picks up the change. |
| A database command prints a message you cannot act on | Something unanticipated | Run it again with `$env:DEBUG_DB = "1"` set to print the full technical detail as well, and send that. |
| `TLS file not found` | `npm run cert:dev` was not run, or the paths are wrong | Run it, or correct `TLS_KEY_PATH` and `TLS_CERT_PATH`. |
| `npm run cert:dev` fails on Windows | No bash or no OpenSSL on the path | Run it from Git Bash, which supplies both. |
| Browser warns the certificate is not trusted | Self-signed certificate | Expected on a pilot. Use a real certificate for participants. |
| Sign-in fails with the correct password | Ten failed attempts within fifteen minutes triggered the rate limit | Wait fifteen minutes. The limit applies per account and per address. |
| A participant cannot start an assessment, and the server log or API response shows `no_bank` | The bank was never loaded or frozen | Run the `db:load-bank` command with `--freeze`, against the right database. |
| A participant sees the sign-in page repeatedly | `APP_URL` starts with `https` but the site is served over plain HTTP, or does not match the address people actually use, so the Secure cookie is dropped | Make `APP_URL` match the address in the browser's address bar. On Vercel, redeploy after changing it. |
| A change to a Vercel environment variable makes no difference | Vercel bakes environment variables into a deployment when it builds it | Redeploy the latest deployment from the Deployments tab. |
| Port already in use | Another copy is running | Stop it, or change `PORT`. |
| Data missing after a restart on a platform host | `DATA_DIR` is not on a persistent volume | Point it at the volume and redeploy. |
| `npm run build` or `npm run start:https` fails with a missing `tsx` or `next` | Dependencies installed with `--omit=dev` | Reinstall with a plain `npm install`. |
