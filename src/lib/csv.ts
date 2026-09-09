/**
 * Minimal RFC 4180 CSV writer. CRLF line endings, double-quote escaping, no
 * byte order mark (exports are ASCII-safe UTF-8 and a BOM would break naive
 * header parsing in scripts/no-pii-check.ts).
 */

export type CsvValue = string | number | null | undefined;

/** Prefixes values that a spreadsheet would treat as a formula with a single quote. */
function guardFormula(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function quote(raw: string): string {
  if (/[",\r\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function cell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return quote(guardFormula(value));
}

/** Renders headers and rows as a CSV document with CRLF line endings and a trailing newline. */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers.map(cell).join(",")];
  for (const row of rows) lines.push(row.map(cell).join(","));
  return `${lines.join("\r\n")}\r\n`;
}
