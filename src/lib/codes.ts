/**
 * Participant code helpers. These live in their own module so that both the participant
 * management layer and the attempt lifecycle can use them without importing each other.
 * A participant code is the only identifier the system holds: there is no personal data.
 */

/** "Participant 7" - the display name derived from the number, never a person's name. */
export function participantDisplayName(number: number): string {
  return `Participant ${number}`;
}

/** "participant-07" for numbers up to 99, "participant-100" beyond. */
export function participantCode(number: number): string {
  return `participant-${number < 100 ? String(number).padStart(2, "0") : String(number)}`;
}
