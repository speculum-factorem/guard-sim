import { describe, expect, it } from "vitest";
import {
  DASHBOARD_TASKS_HREF,
  DEFAULT_AFTER_AUTH,
  loginHref,
  safeNextPath,
} from "./navigationConstants";

describe("safeNextPath", () => {
  it("defaults for empty or external-like paths", () => {
    expect(safeNextPath(null)).toBe(DEFAULT_AFTER_AUTH);
    expect(safeNextPath("")).toBe(DEFAULT_AFTER_AUTH);
    expect(safeNextPath("//evil.com")).toBe(DEFAULT_AFTER_AUTH);
    expect(safeNextPath("relative")).toBe(DEFAULT_AFTER_AUTH);
  });

  it("accepts internal absolute paths", () => {
    expect(safeNextPath("/sim/x")).toBe("/sim/x");
  });
});

describe("loginHref", () => {
  it("encodes next query", () => {
    expect(loginHref("/dashboard#tasks")).toContain("next=%2Fdashboard%23tasks");
  });
});

describe("DASHBOARD_TASKS_HREF", () => {
  it("points at dashboard hash", () => {
    expect(DASHBOARD_TASKS_HREF).toBe("/dashboard#tasks");
  });
});
