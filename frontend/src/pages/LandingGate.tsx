import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchMe } from "../api";
import { clearAuthToken, getAuthToken } from "../authToken";
import { notifyAuthChanged } from "../authEvents";
import { isJwtExpired } from "../jwtPayload";
import { HomePage } from "./HomePage";

type Phase = "loading" | "home" | "dashboard";

/**
 * Лендинг для гостей; при валидном сессионном JWT — редирект на дашборд
 * (проверка срока + /api/auth/me, без мигания на просроченном токене).
 */
export function LandingGate() {
  const [phase, setPhase] = useState<Phase>(() => (getAuthToken() ? "loading" : "home"));

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setPhase("home");
      return;
    }
    if (isJwtExpired(token)) {
      clearAuthToken();
      notifyAuthChanged();
      setPhase("home");
      return;
    }

    let cancelled = false;
    fetchMe()
      .then(() => {
        if (!cancelled) setPhase("dashboard");
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthToken();
          notifyAuthChanged();
          setPhase("home");
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

  if (phase === "dashboard") {
    return <Navigate to="/dashboard" replace />;
  }

  return <HomePage />;
}
