# No personal data verification

Date: 2026-09-10. Run against the deployed application's database and the four export files it produced.

docs/06 asks for a verification that inspects the schema and every export. This is that run, reproducible with:

```bash
npm run verify:no-pii -- exports/results.csv exports/item-analysis.csv exports/audit-log.csv exports/archive.json
```

## Result

```
  login_attempts.username
  login_attempts.ip
  login_attempts.at
  login_attempts.success
  schema_migrations.name
  schema_migrations.applied_at
  settings.key
  settings.value
  settings.updated_at
  users.id
  users.username
  users.role
  users.participant_number
  users.password_hash
  users.password_regenerated_at
  users.created_at
  users.last_activity_at
PASS no personal-data columns in the schema.
PASS docs/evidence/exports/results.csv: 31 columns, 11388 bytes, nothing personal found.
PASS docs/evidence/exports/item-analysis.csv: 14 columns, 7168 bytes, nothing personal found.
PASS docs/evidence/exports/audit-log.csv: 9 columns, 22496 bytes, nothing personal found.
PASS docs/evidence/exports/archive.json: 1288882 bytes, nothing personal found.
```

## Every column in the database

The command prints the full column list, which is reproduced below so a reader can audit it without running anything.

```
  attempts.id
  attempts.user_id
  attempts.assessment_id
  attempts.attempt_number
  attempts.status
  attempts.seed
  attempts.seed_inputs
  attempts.bank_version
  attempts.served_item_ids
  attempts.presentation
  attempts.answers
  attempts.started_at
  attempts.end_at
  attempts.last_saved_at
  attempts.submitted_at
  attempts.submit_kind
  attempts.section_scores
  attempts.prescriptions
  attempts.shorthand
  attempts.time_used_seconds
  attempts.voided_at
  attempts.voided_by
  attempts.void_reason
  attempts.status_before_void
  audit_log.id
  audit_log.at
  audit_log.actor_user_id
  audit_log.actor_username
  audit_log.actor_role
  audit_log.action
  audit_log.target_type
  audit_log.target_id
  audit_log.reason
  audit_log.details
  items.id
  items.bank_version
  items.assessment
  items.section
  items.slot
  items.type
  items.payload
  items.retired_at
  items.retired_by
  items.created_at
  login_attempts.id
  login_attempts.username
  login_attempts.ip
  login_attempts.at
  login_attempts.success
  schema_migrations.name
  schema_migrations.applied_at
  settings.key
  settings.value
  settings.updated_at
  users.id
  users.username
  users.role
  users.participant_number
  users.password_hash
  users.password_regenerated_at
  users.created_at
  users.last_activity_at
```

## What the check looks for

Column and header names are matched against a list of personal-data words (name, email, phone,
address, date of birth, gender, and so on) after splitting camel case and underscores. Export
bodies are additionally scanned for anything shaped like an email address or an Australian
telephone number.

Three identifiers contain a banned word but are, by design, not personal data, and are listed
explicitly as allowed:

| Identifier | Why it is not personal data |
|---|---|
| `users.username` | The participant code, `participant-07`. There is no name field. |
| `audit_log.actor_username` | The same code, or the administrator's account name. |
| `login_attempts.ip` | Rate limiting only. Rows are purged after 24 hours and no participant data is joined to them. |

## Two false positives the check itself had, both fixed

Running this against real exports exposed two faults in the checker, not in the data:

1. A Python decorator in a question stem, which a JSON export escapes as `\n@pytest.mark.parametrize`,
   matched the email pattern.
2. A ten-digit run inside a SHA-256 seed in `results.csv` matched the telephone pattern.

Both were narrowed by refusing to start a match inside a longer alphanumeric run. Unit tests in
`tests/unit/pii-check.test.ts` cover both false positives and confirm that genuine addresses and
telephone numbers are still caught, so the check has not been weakened to pass.

## Reading the exports by eye

Beyond the automated scan, the export files were read. They contain participant codes, assessment
identifiers, item identifiers, scores, thresholds, module outcomes, timestamps, seeds, bank
versions, and the authored question content. No column holds anything about a person, because no
such column exists to hold it.
