import { getAuthToken } from "./authToken";
import { isJwtExpired } from "./jwtPayload";
import type { UserMe } from "./types";

const STORAGE_KEY = "guardsim-demo-unlocked";

function hasValidAuthToken(): boolean {
  const t = getAuthToken();
  return Boolean(t && !isJwtExpired(t));
}

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

/**
 * В шапке «в аккаунте» только при живом JWT; иначе после выхода устаревший `me` давал ложный «залогинен».
 */
export function isRegisteredInUi(me: UserMe | null): boolean {
  return Boolean(hasValidAuthToken() && me && !me.guest);
}

/**
 * Доступ к основным экранам: валидный JWT + профиль не гость, либо явное демо.
 * Без токена `me` с guest:false из кэша не открывает приложение (нужен флаг демо).
 */
export function canUseAppRoutes(me: UserMe | null): boolean {
  if (hasValidAuthToken()) {
    if (me == null) {
      return true;
    }
    return !me.guest;
  }
  return isDemoModeActive();
}
