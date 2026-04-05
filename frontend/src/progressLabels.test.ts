import { describe, expect, it } from "vitest";
import { experienceSummary, levelFromExperience, levelLabel, xpIntoCurrentLevel } from "./progressLabels";

describe("levelFromExperience", () => {
  it("maps 0–99 to level 1, 100 to 2", () => {
    expect(levelFromExperience(0)).toBe(1);
    expect(levelFromExperience(99)).toBe(1);
    expect(levelFromExperience(100)).toBe(2);
  });

  it("clamps negative to level 1", () => {
    expect(levelFromExperience(-10)).toBe(1);
  });
});

describe("xpIntoCurrentLevel", () => {
  it("returns remainder mod 100", () => {
    expect(xpIntoCurrentLevel(150)).toBe(50);
    expect(xpIntoCurrentLevel(0)).toBe(0);
  });
});

describe("experienceSummary", () => {
  it("includes XP, level label and XP to next", () => {
    const s = experienceSummary(250);
    expect(s).toContain("250 XP");
    expect(s).toContain(levelLabel(3));
    expect(s).toContain("до следующего уровня: 50 XP");
  });
});
