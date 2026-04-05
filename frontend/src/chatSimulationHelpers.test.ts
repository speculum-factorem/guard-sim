import { describe, expect, it } from "vitest";
import { splitChatSegments } from "./chatSimulationHelpers";

describe("splitChatSegments", () => {
  it("returns empty for blank", () => {
    expect(splitChatSegments("   ")).toEqual([]);
  });

  it("splits on double newline", () => {
    expect(splitChatSegments("a\n\nb")).toEqual(["a", "b"]);
  });

  it("single block for short single line", () => {
    expect(splitChatSegments("Hello")).toEqual(["Hello"]);
  });
});
