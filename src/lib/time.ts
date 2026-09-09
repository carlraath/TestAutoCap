/**
 * Time helpers. Everything is stored in UTC and displayed in Australia/Melbourne.
 * Month names are mapped by hand so "Sep" never renders as ICU's "Sept".
 */

export const DISPLAY_TIME_ZONE = "Australia/Melbourne";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Parts {
  year: string;
  month: number;
  day: string;
  hour: string;
  minute: string;
  second: string;
  zone: string;
}

function melbourneParts(date: Date): Parts {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
  const lookup: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) lookup[part.type] = part.value;
  return {
    year: lookup.year ?? "",
    month: Number(lookup.month ?? "1"),
    day: lookup.day ?? "",
    // Some ICU builds render midnight as "24".
    hour: (lookup.hour ?? "00").replace(/^24$/, "00"),
    minute: lookup.minute ?? "00",
    second: lookup.second ?? "00",
    zone: lookup.timeZoneName ?? "",
  };
}

/** Formats an instant for display in Melbourne time, e.g. "9 Sep 2026, 21:40". */
export function formatMelbourne(date: Date): string {
  const p = melbourneParts(date);
  return `${Number(p.day)} ${MONTHS[p.month - 1]} ${p.year}, ${p.hour}:${p.minute}`;
}

/** Formats an instant for exports in Melbourne time with the zone, e.g. "2026-09-09 21:40:12 AEST". */
export function formatMelbourneDateTimeWithZone(date: Date): string {
  const p = melbourneParts(date);
  const month = String(p.month).padStart(2, "0");
  const day = p.day.padStart(2, "0");
  return `${p.year}-${month}-${day} ${p.hour}:${p.minute}:${p.second} ${p.zone}`;
}

/** The current instant as an ISO 8601 UTC string. */
export function nowIso(): string {
  return new Date().toISOString();
}
