import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadTaskListFilters, saveTaskListFilters, TASK_LIST_FILTERS_DEFAULTS } from "./taskListFiltersStorage";

const KEY = "guardSim.taskListFilters.v1";

function mockLocalStorage() {
  const mem: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
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
  });
  return mem;
}

describe("taskListFiltersStorage", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns defaults when empty", () => {
    const s = loadTaskListFilters();
    expect(s.query).toBe(TASK_LIST_FILTERS_DEFAULTS.query);
    expect(s.showCompleted).toBe(true);
    expect(s.pageSize).toBe(10);
  });

  it("roundtrips save and load", () => {
    saveTaskListFilters({
      query: "test",
      channel: "mail",
      sortColumn: "title",
      sortDir: "desc",
      pageSize: 25,
      showCompleted: false,
    });
    const s = loadTaskListFilters();
    expect(s.query).toBe("test");
    expect(s.channel).toBe("mail");
    expect(s.sortColumn).toBe("title");
    expect(s.sortDir).toBe("desc");
    expect(s.pageSize).toBe(25);
    expect(s.showCompleted).toBe(false);
    expect(localStorage.getItem(KEY)).toBeTruthy();
  });

  it("ignores invalid pageSize", () => {
    localStorage.setItem(KEY, JSON.stringify({ pageSize: 999, query: "q" }));
    expect(loadTaskListFilters().pageSize).toBe(10);
  });
});
