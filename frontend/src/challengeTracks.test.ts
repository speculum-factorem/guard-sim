import { describe, expect, it } from "vitest";
import { CHALLENGE_TRACKS, NEWCOMER_COMPLETION_THRESHOLD } from "./challengeTracks";

describe("CHALLENGE_TRACKS", () => {
  it("has unique track ids", () => {
    const ids = CHALLENGE_TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has non-empty scenario lists with unique ids per track", () => {
    for (const t of CHALLENGE_TRACKS) {
      expect(t.scenarioIds.length).toBeGreaterThan(0);
      expect(new Set(t.scenarioIds).size).toBe(t.scenarioIds.length);
    }
  });

  it("marks at most one newcomer track", () => {
    const rec = CHALLENGE_TRACKS.filter((t) => t.recommendedForNewcomers);
    expect(rec.length).toBeLessThanOrEqual(1);
  });
});

describe("NEWCOMER_COMPLETION_THRESHOLD", () => {
  it("is positive", () => {
    expect(NEWCOMER_COMPLETION_THRESHOLD).toBeGreaterThan(0);
  });
});
