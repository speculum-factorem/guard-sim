const STORAGE_KEY = "guardSim.missionSplitHintDismissed.v1";

export function isMissionSplitHintDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissMissionSplitHint(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}
