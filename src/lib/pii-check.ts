/**
 * No-PII verification shared by the integration test and scripts/no-pii-check.ts.
 * Works on column names (table.column) and on export headers.
 */

const BANNED_TOKENS = new Set([
  "name",
  "firstname",
  "lastname",
  "fullname",
  "surname",
  "givenname",
  "email",
  "mail",
  "phone",
  "mobile",
  "telephone",
  "address",
  "street",
  "postcode",
  "zip",
  "dob",
  "birth",
  "birthday",
  "birthdate",
  "gender",
  "sex",
  "nationality",
  "passport",
  "licence",
  "license",
  "ssn",
  "tfn",
  "employee",
  "employer",
  "company",
  "client",
  "customer",
  "photo",
  "avatar",
]);

const BANNED_PAIRS = [
  ["first", "name"],
  ["last", "name"],
  ["full", "name"],
  ["given", "name"],
  ["display", "name"],
  ["user", "name"],
  ["real", "name"],
  ["ip", "address"],
];

/** Identifiers that contain a banned token but are, by design, not personal data. */
const ALLOWED_EXACT = new Set([
  "users.username", // the participant code, e.g. participant-01
  "audit_log.actor_username", // the participant code or admin username
  "login_attempts.ip", // rate limiting only; rows are purged after 24 hours
  "schema_migrations.name", // migration file name
  "items.payload", // authored question content, reviewed for client names before load
]);

function tokens(identifier: string): string[] {
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Returns the identifiers that look like personal-data fields.
 * @param identifiers e.g. ["users.username", "users.email"] or CSV headers ["participant", "email"]
 */
export function findPiiIdentifiers(identifiers: string[]): string[] {
  const offenders: string[] = [];
  for (const id of identifiers) {
    if (ALLOWED_EXACT.has(id.toLowerCase())) continue;
    const column = id.includes(".") ? id.slice(id.indexOf(".") + 1) : id;
    const toks = tokens(column);
    const joined = toks.join("");
    if (joined === "username") continue; // the participant code
    const hit =
      toks.some((t) => BANNED_TOKENS.has(t)) ||
      BANNED_PAIRS.some(([a, b]) => joined.includes(a + b)) ||
      /(^|_)(e_?mail)(_|$)/.test(column.toLowerCase());
    if (hit) offenders.push(id);
  }
  return offenders;
}

/** Scans free text (an export body) for things that look like email addresses or phone numbers. */
export function findPiiInText(text: string): string[] {
  const findings: string[] = [];
  const emails = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  if (emails) findings.push(...emails.map((e) => `email-like: ${e}`));
  const phones = text.match(/(?:\+?61|0)[2-478](?:[ -]?\d){8}\b/g);
  if (phones) findings.push(...phones.map((p) => `phone-like: ${p}`));
  return findings;
}
