import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("uses CRLF line endings, a trailing newline and no byte order mark", () => {
    const out = toCsv(["a", "b"], [["1", "2"]]);
    expect(out).toBe("a,b\r\n1,2\r\n");
    expect(out.charCodeAt(0)).not.toBe(0xfeff);
  });

  it("quotes values containing commas, quotes and line breaks per RFC 4180", () => {
    const out = toCsv(["h"], [['say "hi", now'], ["line1\nline2"], ["plain"]]);
    expect(out).toBe('h\r\n"say ""hi"", now"\r\n"line1\nline2"\r\nplain\r\n');
  });

  it("renders numbers, null and undefined", () => {
    expect(toCsv(["n", "x", "y"], [[42, null, undefined]])).toBe("n,x,y\r\n42,,\r\n");
  });

  it("guards formula injection by prefixing =, +, - and @ with a single quote", () => {
    const out = toCsv(["v"], [["=SUM(A1)"], ["+1"], ["-1"], ["@cmd"], ["safe"]]);
    expect(out).toBe("v\r\n'=SUM(A1)\r\n'+1\r\n'-1\r\n'@cmd\r\nsafe\r\n");
  });

  it("quotes a guarded value that also needs quoting", () => {
    expect(toCsv(["v"], [["=1,2"]])).toBe("v\r\n\"'=1,2\"\r\n");
  });
});
