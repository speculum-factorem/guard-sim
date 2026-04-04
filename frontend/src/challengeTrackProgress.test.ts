import { describe, expect, it } from "vitest";
import type { ChallengeTrackDef } from "./challengeTracks";
import {
  areAllTracksCompleted,
  getCompletedTracks,
  getNextIncompleteTrackStep,
  isTrackFullyCompleted,
} from "./challengeTrackProgress";
import type { ScenarioSummary } from "./types";

function sc(id: string): ScenarioSummary {
  return {
    id,
    title: `Title ${id}`,
    type: "EMAIL",
    description: "",
  };
}

const trackA: ChallengeTrackDef = {
  id: "a",
  title: "A",
  description: "",
  scenarioIds: ["s1", "s2"],
  accent: "mint",
};

const trackB: ChallengeTrackDef = {
  id: "b",
  title: "B",
  description: "",
  scenarioIds: ["s3"],
  accent: "lilac",
};

describe("isTrackFullyCompleted", () => {
  it("returns false when empty ids", () => {
    const t: ChallengeTrackDef = { ...trackA, scenarioIds: [] };
    expect(isTrackFullyCompleted(t, new Set(["s1"]))).toBe(false);
  });

  it("returns true when all ids completed", () => {
    expect(isTrackFullyCompleted(trackA, new Set(["s1", "s2"]))).toBe(true);
  });

  it("returns false when one missing", () => {
    expect(isTrackFullyCompleted(trackA, new Set(["s1"]))).toBe(false);
  });
});

describe("getCompletedTracks", () => {
  it("filters fully completed only", () => {
    const r = getCompletedTracks([trackA, trackB], new Set(["s1", "s2", "s3"]));
    expect(r.map((t) => t.id).sort()).toEqual(["a", "b"]);
  });
});

describe("getNextIncompleteTrackStep", () => {
  const byId = new Map<string, ScenarioSummary>([
    ["s1", sc("s1")],
    ["s2", sc("s2")],
    ["s3", sc("s3")],
  ]);

  it("returns first incomplete in first track", () => {
    const r = getNextIncompleteTrackStep([trackA, trackB], new Set<string>(), byId);
    expect(r?.track.id).toBe("a");
    expect(r?.scenario.id).toBe("s1");
    expect(r?.stepNumber).toBe(1);
  });

  it("skips completed and finds next", () => {
    const r = getNextIncompleteTrackStep([trackA, trackB], new Set(["s1"]), byId);
    expect(r?.scenario.id).toBe("s2");
    expect(r?.stepNumber).toBe(2);
  });

  it("moves to next track when first complete", () => {
    const r = getNextIncompleteTrackStep([trackA, trackB], new Set(["s1", "s2"]), byId);
    expect(r?.track.id).toBe("b");
    expect(r?.scenario.id).toBe("s3");
  });

  it("returns null when all done", () => {
    expect(getNextIncompleteTrackStep([trackA], new Set(["s1", "s2"]), byId)).toBeNull();
  });
});

describe("areAllTracksCompleted", () => {
  it("requires non-empty tracks list", () => {
    expect(areAllTracksCompleted([], new Set())).toBe(false);
  });

  it("true when every track complete", () => {
    expect(areAllTracksCompleted([trackA, trackB], new Set(["s1", "s2", "s3"]))).toBe(true);
  });
});
