import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe } from "../api";
import { clearAuthToken, getAuthToken, setAuthToken } from "../authToken";
import { isDemoModeActive, setDemoModeActive } from "../demoMode";
import { isJwtExpired } from "../jwtPayload";
import { resetGuestPlayerId, setPlayerId } from "../playerId";
import type { AuthResponse, UserMe } from "../types";

type Phase = "loading" | "ready";

export interface AuthContextValue {
  phase: Phase;
  me: UserMe | null;
  canUseApp: boolean;
  refresh: () => Promise<void>;
  enterDemo: () => Promise<void>;
  logout: () => Promise<void>;
  applyAuthResponse: (r: AuthResponse) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function computeAccess(): Promise<{ canUseApp: boolean; me: UserMe | null }> {
  if (await isDemoModeActive()) {
    return { canUseApp: true, me: null };
  }
  const token = await getAuthToken();
  if (!token || isJwtExpired(token)) {
    return { canUseApp: false, me: null };
  }
  try {
    const u = await fetchMe();
    return { canUseApp: !u.guest, me: u };
  } catch {
    await clearAuthToken();
    return { canUseApp: false, me: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [me, setMe] = useState<UserMe | null>(null);
  const [canUseApp, setCanUseApp] = useState(false);

  const refresh = useCallback(async () => {
    const { canUseApp: ok, me: m } = await computeAccess();
    setCanUseApp(ok);
    setMe(m);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase("loading");
      await refresh();
      if (!cancelled) {
        setPhase("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const enterDemo = useCallback(async () => {
    await setDemoModeActive(true);
    await clearAuthToken();
    await resetGuestPlayerId();
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await clearAuthToken();
    await setDemoModeActive(false);
    await refresh();
  }, [refresh]);

  const applyAuthResponse = useCallback(
    async (r: AuthResponse) => {
      await setAuthToken(r.accessToken);
      await setPlayerId(r.playerId);
      await setDemoModeActive(false);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      phase,
      me,
      canUseApp,
      refresh,
      enterDemo,
      logout,
      applyAuthResponse,
    }),
    [phase, me, canUseApp, refresh, enterDemo, logout, applyAuthResponse],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
