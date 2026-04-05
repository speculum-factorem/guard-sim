import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthToken } from "./authToken";
import { isJwtExpired } from "./jwtPayload";
import type { UserMe } from "./types";

const STORAGE_KEY = "guardsim-demo-unlocked";

async function hasValidAuthToken(): Promise<boolean> {
  const t = await getAuthToken();
  return Boolean(t && !isJwtExpired(t));
}

export async function isDemoModeActive(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setDemoModeActive(active: boolean): Promise<void> {
  try {
    if (active) {
      await AsyncStorage.setItem(STORAGE_KEY, "1");
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export async function isRegisteredInUi(me: UserMe | null): Promise<boolean> {
  return Boolean((await hasValidAuthToken()) && me && !me.guest);
}

export async function canUseAppRoutes(me: UserMe | null): Promise<boolean> {
  if (await hasValidAuthToken()) {
    if (me == null) {
      return true;
    }
    return !me.guest;
  }
  return await isDemoModeActive();
}
