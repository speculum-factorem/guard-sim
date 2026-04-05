import { describe, expect, it } from "vitest";
import {
  extractEmailFromHeader,
  seedFromStepId,
  syntheticReplyTo,
  urlCharDiffPair,
} from "./simMicroUiHelpers";

describe("extractEmailFromHeader", () => {
  it("parses angle-bracket form", () => {
    expect(extractEmailFromHeader('PayPal <no-reply@paypal.com>')).toBe("no-reply@paypal.com");
  });

  it("returns plain address", () => {
    expect(extractEmailFromHeader("user@example.org")).toBe("user@example.org");
  });
});

describe("syntheticReplyTo", () => {
  it("is stable for same inputs", () => {
    const a = syntheticReplyTo("step-1", "a@b.c");
    const b = syntheticReplyTo("step-1", "a@b.c");
    expect(a).toEqual(b);
  });
});

describe("seedFromStepId", () => {
  it("is deterministic", () => {
    expect(seedFromStepId("abc")).toBe(seedFromStepId("abc"));
  });
});

describe("urlCharDiffPair", () => {
  it("marks differing positions", () => {
    const { left, right } = urlCharDiffPair("ab", "aX");
    expect(left[1]!.diff).toBe(true);
    expect(right[1]!.diff).toBe(true);
    expect(left[0]!.diff).toBe(false);
  });
});
