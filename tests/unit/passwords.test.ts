import { describe, expect, it } from "vitest";
import { generatePassword, hashPassword, verifyPassword } from "@/lib/passwords";
import { WORDLIST } from "@/lib/wordlist";

describe("wordlist", () => {
  it("has at least 300 unique lower-case words of 5 to 8 letters", () => {
    expect(WORDLIST.length).toBeGreaterThanOrEqual(300);
    expect(new Set(WORDLIST).size).toBe(WORDLIST.length);
    for (const w of WORDLIST) expect(w).toMatch(/^[a-z]{5,8}$/);
  });
});

describe("generatePassword", () => {
  it("is three hyphenated words from the list plus a 2 or 3 digit number", () => {
    for (let i = 0; i < 50; i += 1) {
      const pw = generatePassword();
      const parts = pw.split("-");
      expect(parts).toHaveLength(4);
      for (const word of parts.slice(0, 3)) expect(WORDLIST).toContain(word);
      expect(parts[3]).toMatch(/^\d{2,3}$/);
      expect(pw).toMatch(/^[a-z]{5,8}-[a-z]{5,8}-[a-z]{5,8}-\d{2,3}$/);
    }
  });

  it("is always 14 characters or more", () => {
    for (let i = 0; i < 200; i += 1) expect(generatePassword().length).toBeGreaterThanOrEqual(14);
  });

  it("varies between calls", () => {
    const set = new Set(Array.from({ length: 20 }, () => generatePassword()));
    expect(set.size).toBeGreaterThan(15);
  });
});

describe("hashPassword / verifyPassword", () => {
  it("round-trips and rejects the wrong password", async () => {
    const hash = await hashPassword("harbour-copper-lantern-42");
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(await verifyPassword("harbour-copper-lantern-42", hash)).toBe(true);
    expect(await verifyPassword("harbour-copper-lantern-43", hash)).toBe(false);
  });

  it("returns false for a malformed hash rather than throwing", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });
});
