import { describe, expect, it } from "vitest";
import { formatMelbourne, formatMelbourneDateTimeWithZone, nowIso } from "@/lib/time";

describe("formatMelbourne", () => {
  it("renders a UTC instant in Melbourne standard time (AEST, UTC+10)", () => {
    expect(formatMelbourne(new Date("2026-09-09T11:40:00Z"))).toBe("9 Sep 2026, 21:40");
  });

  it("renders a UTC instant in Melbourne daylight time (AEDT, UTC+11)", () => {
    expect(formatMelbourne(new Date("2026-01-15T13:05:00Z"))).toBe("16 Jan 2026, 00:05");
  });

  it("crosses the date line correctly", () => {
    expect(formatMelbourne(new Date("2026-12-31T14:30:00Z"))).toBe("1 Jan 2027, 01:30");
  });
});

describe("formatMelbourneDateTimeWithZone", () => {
  it("renders an export timestamp with the AEST zone", () => {
    expect(formatMelbourneDateTimeWithZone(new Date("2026-09-09T11:40:12Z"))).toBe("2026-09-09 21:40:12 AEST");
  });

  it("renders an export timestamp with the AEDT zone", () => {
    expect(formatMelbourneDateTimeWithZone(new Date("2026-01-15T13:05:07Z"))).toBe("2026-01-16 00:05:07 AEDT");
  });
});

describe("nowIso", () => {
  it("returns an ISO 8601 UTC string", () => {
    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
