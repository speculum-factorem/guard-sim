import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncWeeklyGoal, WEEKLY_SCENARIO_TARGET } from "./weeklyGoalStorage";

const KEY = "guardSim.weeklyScenarioGoal.v1";

function mockLocalStorage() {
  const mem: Record<string, string> = {};
  const ls = {
    getItem: (k: string) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
    setItem: (k: string, v: string) => {
      mem[k] = v;
    },
    removeItem: (k: string) => {
      delete mem[k];
    },
    clear: () => {
      for (const k of Object.keys(mem)) {
        delete mem[k];
      }
    },
    get length() {
      return Object.keys(mem).length;
    },
    key: (i: number) => Object.keys(mem)[i] ?? null,
  };
  vi.stubGlobal("localStorage", ls);
  return mem;
}

describe("syncWeeklyGoal", () => {
  beforeEach(() => {
    mockLocalStorage();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("first visit in week returns 0 and sets baseline", () => {
    vi.setSystemTime(new Date("2026-04-06T12:00:00")); // Monday
    const r = syncWeeklyGoal([]);
    expect(r.current).toBe(0);
    expect(r.target).toBe(WEEKLY_SCENARIO_TARGET);
    expect(r.weekStartKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("counts new completions since last sync", () => {
    vi.setSystemTime(new Date("2026-04-06T12:00:00"));
    syncWeeklyGoal([]);
    const r = syncWeeklyGoal(["a", "b"]);
    expect(r.current).toBe(2);
  });

  it("does not double-count same ids", () => {
    vi.setSystemTime(new Date("2026-04-06T12:00:00"));
    syncWeeklyGoal([]);
    expect(syncWeeklyGoal(["a"]).current).toBe(1);
    expect(syncWeeklyGoal(["a"]).current).toBe(1);
    expect(syncWeeklyGoal(["a", "b"]).current).toBe(2);
  });

  it("resets on new week", () => {
    vi.setSystemTime(new Date("2026-04-06T12:00:00"));
    syncWeeklyGoal([]);
    expect(syncWeeklyGoal(["a"]).current).toBe(1);

    vi.setSystemTime(new Date("2026-04-13T12:00:00")); // next Monday
    expect(syncWeeklyGoal(["a", "b"]).current).toBe(0);
    expect(syncWeeklyGoal(["a", "b", "c"]).current).toBe(1);
  });

  it("persists state in localStorage", () => {
    vi.setSystemTime(new Date("2026-04-06T12:00:00"));
    syncWeeklyGoal([]);
    syncWeeklyGoal(["p"]);
    const raw = localStorage.getItem(KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { weeklyNewCompletions: number };
    expect(parsed.weeklyNewCompletions).toBe(1);
  });
});
