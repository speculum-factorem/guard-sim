import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dismissMissionSplitHint, isMissionSplitHintDismissed } from "./missionLayoutHintStorage";

describe("missionLayoutHintStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("starts false", () => {
    expect(isMissionSplitHintDismissed()).toBe(false);
  });

  it("persists dismiss", () => {
    dismissMissionSplitHint();
    expect(isMissionSplitHintDismissed()).toBe(true);
  });
});
