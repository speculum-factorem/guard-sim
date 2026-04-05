import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFENDER_SCENARIO_LABELS,
  loadDefenderStats,
  recordDefenderLoss,
  recordDefenderWin,
} from "./defenderStatsStorage";

describe("defenderStatsStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults empty stats", () => {
    const s = loadDefenderStats();
    expect(s.gamesPlayed).toBe(0);
    expect(s.wins).toBe(0);
    expect(s.losses).toBe(0);
  });

  it("recordDefenderWin increments wins and mode counters", () => {
    recordDefenderWin({ scenarioId: "sqlslayer", gameMode: "standard", score: 10, elapsedSec: 5 });
    const s = loadDefenderStats();
    expect(s.gamesPlayed).toBe(1);
    expect(s.wins).toBe(1);
    expect(s.winsStandard).toBe(1);
    expect(s.winsPractice).toBe(0);
    expect(s.winsByScenarioId.sqlslayer).toBe(1);
    expect(s.bestScore).toBe(10);
  });

  it("recordDefenderLoss increments losses", () => {
    recordDefenderLoss({ scenarioId: "tigerrat", gameMode: "practice", elapsedSec: 2 });
    const s = loadDefenderStats();
    expect(s.gamesPlayed).toBe(1);
    expect(s.losses).toBe(1);
    expect(s.lossesPractice).toBe(1);
  });

  it("migrates legacy combat/training keys", () => {
    localStorage.setItem(
      "guardsim-defender-stats-v1",
      JSON.stringify({
        gamesPlayed: 2,
        wins: 2,
        losses: 1,
        winsCombat: 1,
        winsTraining: 1,
        lossesCombat: 1,
        lossesTraining: 0,
      }),
    );
    const s = loadDefenderStats();
    expect(s.winsStandard).toBe(2);
    expect(s.lossesStandard).toBe(1);
  });
});

describe("DEFENDER_SCENARIO_LABELS", () => {
  it("has known ids", () => {
    expect(DEFENDER_SCENARIO_LABELS.sqlslayer).toBeDefined();
  });
});
