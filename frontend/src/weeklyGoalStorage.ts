/**
 * Локальная цель «N сценариев на этой неделе» без бэкенда.
 * Считаем новые завершения: id появился в completedScenarioIds и не был в снимке на начало недели / прошлого визита.
 */

export const WEEKLY_SCENARIO_TARGET = 3;

const STORAGE_KEY = "guardSim.weeklyScenarioGoal.v1";

export interface WeeklyGoalState {
  /** Понедельник текущей учётной недели (YYYY-MM-DD) */
  weekStartKey: string;
  /** Снимок пройденных id с прошлого визита (для диффа новых завершений) */
  lastSeenCompletedIds: string[];
  /** Сколько новых завершений засчитано на этой неделе */
  weeklyNewCompletions: number;
}

function mondayDateKey(d = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const dayNum = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

function loadRaw(): WeeklyGoalState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const p = JSON.parse(raw) as Partial<WeeklyGoalState>;
    if (
      typeof p.weekStartKey !== "string" ||
      !Array.isArray(p.lastSeenCompletedIds) ||
      typeof p.weeklyNewCompletions !== "number"
    ) {
      return null;
    }
    return {
      weekStartKey: p.weekStartKey,
      lastSeenCompletedIds: p.lastSeenCompletedIds.filter((x): x is string => typeof x === "string"),
      weeklyNewCompletions: p.weeklyNewCompletions,
    };
  } catch {
    return null;
  }
}

function save(state: WeeklyGoalState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

/**
 * Обновляет состояние по текущему списку пройденных и возвращает актуальные цифры для UI.
 */
export function syncWeeklyGoal(completedScenarioIds: readonly string[]): { current: number; target: number; weekStartKey: string } {
  const currentWeek = mondayDateKey();
  const completed = [...completedScenarioIds];

  let state = loadRaw();

  if (!state || state.weekStartKey !== currentWeek) {
    state = {
      weekStartKey: currentWeek,
      lastSeenCompletedIds: completed,
      weeklyNewCompletions: 0,
    };
    save(state);
    return { current: 0, target: WEEKLY_SCENARIO_TARGET, weekStartKey: currentWeek };
  }

  const lastSeen = new Set(state.lastSeenCompletedIds);
  let added = 0;
  for (const id of completed) {
    if (!lastSeen.has(id)) {
      added += 1;
    }
  }

  const weeklyNewCompletions = state.weeklyNewCompletions + added;
  const next: WeeklyGoalState = {
    weekStartKey: currentWeek,
    lastSeenCompletedIds: completed,
    weeklyNewCompletions,
  };
  save(next);

  return {
    current: weeklyNewCompletions,
    target: WEEKLY_SCENARIO_TARGET,
    weekStartKey: currentWeek,
  };
}
