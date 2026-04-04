import type { PlayerAchievementState } from "./types";

/** Сначала открытые награды, затем по названию. */
export function sortAchievementsForDisplay(list: PlayerAchievementState[]): PlayerAchievementState[] {
  return [...list].sort((a, b) => {
    if (a.unlocked !== b.unlocked) {
      return a.unlocked ? -1 : 1;
    }
    return a.title.localeCompare(b.title, "ru");
  });
}
