import { useEffect, useState } from "react";
import { fetchMe } from "../api";
import { clearAuthToken, getAuthToken } from "../authToken";
import { notifyAuthChanged } from "../authEvents";
import { isJwtExpired } from "../jwtPayload";
import { HomePage } from "./HomePage";

type Phase = "loading" | "ready";

/**
 * Главная страница — лендинг для всех. Проверяем JWT (срок + /api/auth/me),
 * чтобы не мигать и сбросить просроченную сессию; дашборд и игра — только через навигацию или после входа.
 */
export function LandingGate() {
  const [phase, setPhase] = useState<Phase>(() => (getAuthToken() ? "loading" : "ready"));

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setPhase("ready");
      return;
    }
    if (isJwtExpired(token)) {
      clearAuthToken();
      notifyAuthChanged();
      setPhase("ready");
      return;
    }

    let cancelled = false;
    fetchMe()
      .then(() => {
        if (!cancelled) {
          setPhase("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthToken();
          notifyAuthChanged();
          setPhase("ready");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "loading") {
    return (
      <div className="auth-page landing-gate" aria-busy="true" aria-live="polite">
        <p className="landing-gate-text">Загрузка…</p>
      </div>
    );
  }

  return <HomePage />;
}
