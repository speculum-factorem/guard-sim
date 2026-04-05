import { describe, expect, it } from "vitest";
import { sortAchievementsForDisplay } from "./achievementSort";
import type { PlayerAchievementState } from "./types";

function ach(id: string, title: string, unlocked: boolean): PlayerAchievementState {
  return {
    id,
    title,
    description: "",
    unlocked,
  };
}

describe("sortAchievementsForDisplay", () => {
  it("puts unlocked first, then sorts by title (ru)", () => {
    const out = sortAchievementsForDisplay([
      ach("b", "Бета", false),
      ach("a", "Альфа", true),
      ach("c", "Вега", false),
    ]);
    expect(out.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});
