import { describe, expect, it } from "vitest";
import { findPiiIdentifiers, findPiiInText } from "@/lib/pii-check";

describe("personal data detection", () => {
  it("flags identifiers that look like personal data", () => {
    expect(findPiiIdentifiers(["users.email", "users.first_name", "profiles.phoneNumber", "x.dob", "y.display_name"])).toHaveLength(5);
  });

  it("accepts the identifiers this schema legitimately uses", () => {
    expect(findPiiIdentifiers(["users.username", "audit_log.actor_username", "login_attempts.ip", "attempts.last_saved_at"])).toEqual([]);
  });

  it("finds real addresses and telephone numbers in free text", () => {
    expect(findPiiInText("contact john.smith@example.com now")).toHaveLength(1);
    expect(findPiiInText("ring 0412 345 678 today")).toHaveLength(1);
    expect(findPiiInText("+61 412 345 678")).toHaveLength(1);
  });

  it("does not mistake a Python decorator in a question stem for an address", () => {
    // A JSON export escapes the newline, so the archive literally contains \n@pytest.mark...
    expect(findPiiInText("\n@pytest.mark.parametrize\ndef test_totals():")).toEqual([]);
    expect(findPiiInText("@pytest.fixture")).toEqual([]);
  });

  it("does not mistake participant codes, references or timestamps for personal data", () => {
    expect(findPiiInText("participant-01 scored 8 of 10")).toEqual([]);
    expect(findPiiInText("ref TMP-4001 at 2026-09-10T05:00:00Z")).toEqual([]);
  });

  it("does not mistake a digit run inside a seed hash for a telephone number", () => {
    // Every results row carries a SHA-256 seed, and a ten-digit run inside one is not a number.
    expect(findPiiInText("seed cb68a1890548911042d1400beaf64580f6b9a62a5986ee3e4472389a8d40e680")).toEqual([]);
    expect(findPiiInText("0786351552cb68a189")).toEqual([]);
  });
});
