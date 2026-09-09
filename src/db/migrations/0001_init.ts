/** First schema. Never edit after it has been applied anywhere; add a new migration instead. */
export const name = "0001_init";

export const statements: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'participant')),
    participant_number integer,
    password_hash text NOT NULL,
    password_regenerated_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_activity_at timestamptz
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx ON users (username)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_participant_number_idx ON users (participant_number)`,

  `CREATE TABLE IF NOT EXISTS items (
    id text PRIMARY KEY,
    bank_version integer NOT NULL,
    assessment text NOT NULL,
    section text NOT NULL,
    slot integer NOT NULL,
    type text NOT NULL,
    payload jsonb NOT NULL,
    retired_at timestamptz,
    retired_by uuid,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS items_slot_idx ON items (assessment, slot)`,

  `CREATE TABLE IF NOT EXISTS attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    assessment_id text NOT NULL,
    attempt_number integer NOT NULL,
    status text NOT NULL CHECK (status IN ('in_progress', 'submitted', 'void')),
    seed text NOT NULL,
    seed_inputs jsonb NOT NULL,
    bank_version integer NOT NULL,
    served_item_ids jsonb NOT NULL,
    presentation jsonb NOT NULL,
    answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    started_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    last_saved_at timestamptz,
    submitted_at timestamptz,
    submit_kind text CHECK (submit_kind IN ('manual', 'expired')),
    section_scores jsonb,
    prescriptions jsonb,
    shorthand text,
    time_used_seconds integer,
    voided_at timestamptz,
    voided_by uuid,
    void_reason text,
    status_before_void text
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS attempts_user_assessment_number_idx ON attempts (user_id, assessment_id, attempt_number)`,
  `CREATE INDEX IF NOT EXISTS attempts_user_idx ON attempts (user_id, assessment_id)`,
  `CREATE INDEX IF NOT EXISTS attempts_status_idx ON attempts (status, end_at)`,

  `CREATE TABLE IF NOT EXISTS audit_log (
    id bigserial PRIMARY KEY,
    at timestamptz NOT NULL DEFAULT now(),
    actor_user_id uuid,
    actor_username text NOT NULL,
    actor_role text NOT NULL,
    action text NOT NULL,
    target_type text,
    target_id text,
    reason text,
    details jsonb
  )`,

  `CREATE TABLE IF NOT EXISTS login_attempts (
    id bigserial PRIMARY KEY,
    username text NOT NULL,
    ip text NOT NULL,
    at timestamptz NOT NULL DEFAULT now(),
    success boolean NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS login_attempts_user_idx ON login_attempts (username, at)`,
  `CREATE INDEX IF NOT EXISTS login_attempts_ip_idx ON login_attempts (ip, at)`,

  `CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
];
