import { randomInt } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { WORDLIST } from "./wordlist";

const BCRYPT_COST = 12;
const MIN_GENERATED_LENGTH = 14;

/** Hashes a password with bcryptjs at cost 12. */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

/** Verifies a password against a bcrypt hash. Returns false on any malformed input rather than throwing. */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    return await compare(password, passwordHash);
  } catch {
    return false;
  }
}

/**
 * Generates a memorable password: three random words joined with hyphens plus
 * a two or three digit number, for example "harbour-copper-lantern-42".
 * Always at least 14 characters. Uses node:crypto randomInt.
 */
export function generatePassword(): string {
  for (;;) {
    const words: string[] = [];
    while (words.length < 3) {
      const word = WORDLIST[randomInt(WORDLIST.length)];
      if (!words.includes(word)) words.push(word);
    }
    const number = randomInt(10, 1000);
    const candidate = `${words.join("-")}-${number}`;
    if (candidate.length >= MIN_GENERATED_LENGTH) return candidate;
  }
}
