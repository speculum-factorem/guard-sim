import { describe, expect, it } from "vitest";
import type { Hotspot, StepPublic } from "../../types";
import { hotspotByVariant } from "./hotspotHelpers";

describe("hotspotByVariant", () => {
  it("matches case-insensitively", () => {
    const hotspots: Hotspot[] = [{ id: "h1", variant: "OK", label: "", choiceId: "c1" }];
    const step = { hotspots } as StepPublic;
    expect(hotspotByVariant(step, "ok")?.variant).toBe("OK");
    expect(hotspotByVariant(step, "missing")).toBeUndefined();
  });
});
