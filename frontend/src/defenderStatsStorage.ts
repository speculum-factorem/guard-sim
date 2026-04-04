/**
 * Локальная статистика SOC Defender (браузер). Не привязана к JWT — как и остальной локальный прогресс.
 */
const STORAGE_KEY = "guardsim-defender-stats-v1";

/** Стандартная игра или тренировка с настраиваемым интервалом хода */
export type DefenderGameMode = "standard" | "practice";

export interface DefenderStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalScore: number;
  bestScore: number;
  totalTimeSec: number;
  winsStandard: number;
  winsPractice: number;
  lossesStandard: number;
  lossesPractice: number;
  winsByScenarioId: Record<string, number>;
  lastPlayedAt: string | null;
}

function defaultStats(): DefenderStats {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    totalScore: 0,
    bestScore: 0,
    totalTimeSec: 0,
    winsStandard: 0,
    winsPractice: 0,
    lossesStandard: 0,
    lossesPractice: 0,
    winsByScenarioId: {},
    lastPlayedAt: null,
  };
}

function migrateFromLegacy(p: Record<string, unknown>): Partial<DefenderStats> | null {
  if (typeof p.winsStandard === "number" || typeof p.winsPractice === "number") {
    return null;
  }
  const wt = typeof p.winsTraining === "number" ? p.winsTraining : 0;
  const wc = typeof p.winsCombat === "number" ? p.winsCombat : 0;
  const lt = typeof p.lossesTraining === "number" ? p.lossesTraining : 0;
  const lc = typeof p.lossesCombat === "number" ? p.lossesCombat : 0;
  return {
    winsStandard: wc + wt,
    winsPractice: 0,
    lossesStandard: lc + lt,
    lossesPractice: 0,
  };
}

export function loadDefenderStats(): DefenderStats {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return defaultStats();
    const p = JSON.parse(raw) as Record<string, unknown>;
    const d = defaultStats();
    const legacy = migrateFromLegacy(p);
    return {
      gamesPlayed: typeof p.gamesPlayed === "number" ? p.gamesPlayed : d.gamesPlayed,
      wins: typeof p.wins === "number" ? p.wins : d.wins,
      losses: typeof p.losses === "number" ? p.losses : d.losses,
      totalScore: typeof p.totalScore === "number" ? p.totalScore : d.totalScore,
      bestScore: typeof p.bestScore === "number" ? p.bestScore : d.bestScore,
      totalTimeSec: typeof p.totalTimeSec === "number" ? p.totalTimeSec : d.totalTimeSec,
      winsStandard:
        typeof p.winsStandard === "number"
          ? p.winsStandard
          : legacy?.winsStandard ?? d.winsStandard,
      winsPractice: typeof p.winsPractice === "number" ? p.winsPractice : legacy?.winsPractice ?? d.winsPractice,
      lossesStandard:
        typeof p.lossesStandard === "number"
          ? p.lossesStandard
          : legacy?.lossesStandard ?? d.lossesStandard,
      lossesPractice:
        typeof p.lossesPractice === "number"
          ? p.lossesPractice
          : legacy?.lossesPractice ?? d.lossesPractice,
      winsByScenarioId:
        p.winsByScenarioId && typeof p.winsByScenarioId === "object"
          ? { ...(p.winsByScenarioId as Record<string, number>) }
          : {},
      lastPlayedAt: typeof p.lastPlayedAt === "string" ? p.lastPlayedAt : null,
    };
  } catch {
    return defaultStats();
  }
}

function save(stats: DefenderStats) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* ignore quota / private mode */
  }
}

export function recordDefenderWin(opts: {
  scenarioId: string;
  gameMode: DefenderGameMode;
  score: number;
  elapsedSec: number;
}) {
  const cur = loadDefenderStats();
  const next: DefenderStats = {
    ...cur,
    gamesPlayed: cur.gamesPlayed + 1,
    wins: cur.wins + 1,
    totalScore: cur.totalScore + opts.score,
    bestScore: Math.max(cur.bestScore, opts.score),
    totalTimeSec: cur.totalTimeSec + opts.elapsedSec,
    winsStandard: cur.winsStandard + (opts.gameMode === "standard" ? 1 : 0),
    winsPractice: cur.winsPractice + (opts.gameMode === "practice" ? 1 : 0),
    winsByScenarioId: {
      ...cur.winsByScenarioId,
      [opts.scenarioId]: (cur.winsByScenarioId[opts.scenarioId] ?? 0) + 1,
    },
    lastPlayedAt: new Date().toISOString(),
  };
  save(next);
}

export function recordDefenderLoss(opts: { scenarioId: string; gameMode: DefenderGameMode; elapsedSec: number }) {
  const cur = loadDefenderStats();
  const next: DefenderStats = {
    ...cur,
    gamesPlayed: cur.gamesPlayed + 1,
    losses: cur.losses + 1,
    totalTimeSec: cur.totalTimeSec + opts.elapsedSec,
    lossesStandard: cur.lossesStandard + (opts.gameMode === "standard" ? 1 : 0),
    lossesPractice: cur.lossesPractice + (opts.gameMode === "practice" ? 1 : 0),
    lastPlayedAt: new Date().toISOString(),
  };
  save(next);
}

export const DEFENDER_SCENARIO_LABELS: Record<string, string> = {
  sqlslayer: "SQL SLAYER",
  tigerrat: "TIGER RAT",
  vaultbreaker: "VAULT BREAKER",
};
