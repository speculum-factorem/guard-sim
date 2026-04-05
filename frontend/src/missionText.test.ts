import { describe, expect, it } from "vitest";
import { missionBriefText, stepAnalysisText } from "./missionText";
import type { StepPublic } from "./types";

function step(p: Partial<StepPublic>): StepPublic {
  return p as StepPublic;
}

describe("missionBriefText", () => {
  it("uses situationBrief when present", () => {
    expect(missionBriefText(step({ situationBrief: "  Custom  " }))).toBe("Custom");
  });

  it("falls back by uiKind", () => {
    const t = missionBriefText(step({ uiKind: "SEARCH_ENGINE_RESULTS" }));
    expect(t).toContain("поиск");
  });
});

describe("stepAnalysisText", () => {
  it("uses narrative when non-empty", () => {
    expect(stepAnalysisText(step({ narrative: "  Do this  " }))).toBe("Do this");
  });

  it("falls back when narrative empty", () => {
    expect(stepAnalysisText(step({ narrative: "   " }))).toContain("интерфейсе");
  });
});
