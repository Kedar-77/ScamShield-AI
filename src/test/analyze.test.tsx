import { describe, expect, it } from "vitest";
import { analyze, levelFor } from "@/lib/analyze";

describe("risk levels", () => {
  it("maps scores to low / caution / high", () => {
    expect(levelFor(29)).toBe("low");
    expect(levelFor(30)).toBe("caution");
    expect(levelFor(60)).toBe("high");
  });
  it("flags OTP requests in messages as high risk", () => {
    const r = analyze(
      "message",
      "URGENT: your account is blocked. Share the OTP now and pay a processing fee.",
    );
    expect(r.level).toBe("high");
  });
  it("finds no warning signs in a plain link", () => {
    expect(analyze("url", "wikipedia.org").findings).toHaveLength(0);
  });
});
