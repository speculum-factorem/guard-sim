import type { UserMe } from "./types";

const STORAGE_KEY = "guardsim-demo-unlocked";

export function isDemoModeActive(): boolean {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDemoModeActive(active: boolean): void {
  try {
    if (active) {
      globalThis.localStorage.setItem(STORAGE_KEY, "1");
    } else {
      globalThis.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Доступ к основным экранам без страницы входа: аккаунт или явное демо с главной / входа / регистрации. */
export function canUseAppRoutes(me: UserMe | null): boolean {
  if (me && !me.guest) {
    return true;
  }
  return isDemoModeActive();
}
