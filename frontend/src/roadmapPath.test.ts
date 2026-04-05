import { describe, expect, it } from "vitest";
import { buildRoadPathD, buildRoadPoints } from "./roadmapPath";

describe("buildRoadPoints", () => {
  it("returns empty for non-positive count", () => {
    expect(buildRoadPoints(0)).toEqual([]);
    expect(buildRoadPoints(-1)).toEqual([]);
  });

  it("centers single point", () => {
    expect(buildRoadPoints(1)).toEqual([{ x: 50, y: 50 }]);
  });

  it("alternates x and keeps y in 16–84 range", () => {
    const pts = buildRoadPoints(4);
    expect(pts).toHaveLength(4);
    expect(pts[0]!.x).toBe(22);
    expect(pts[1]!.x).toBe(78);
    expect(pts.every((p) => p.y >= 16 && p.y <= 84)).toBe(true);
  });
});

describe("buildRoadPathD", () => {
  it("returns empty for no points", () => {
    expect(buildRoadPathD([])).toBe("");
  });

  it("is M-only for one point", () => {
    expect(buildRoadPathD([{ x: 10, y: 20 }])).toBe("M 10 20");
  });

  it("connects two points with a cubic segment", () => {
    const d = buildRoadPathD([
      { x: 22, y: 16 },
      { x: 78, y: 84 },
    ]);
    expect(d.startsWith("M 22 16")).toBe(true);
    expect(d.includes("C")).toBe(true);
  });
});
