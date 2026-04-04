import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { fetchMe } from "../api";
import { notifyAuthChanged, subscribeAuthChanged } from "../authEvents";
import { clearAuthToken, getAuthToken } from "../authToken";
import { isDemoModeActive } from "../demoMode";
import { isJwtExpired } from "../jwtPayload";
import { loginHref } from "../navigationConstants";

type GateStatus = "loading" | "ok" | "denied";

function accessFromSession(): GateStatus {
  if (isDemoModeActive()) {
    return "ok";
  }
  const token = getAuthToken();
  if (!token || isJwtExpired(token)) {
    return "denied";
  }
  return "loading";
}

/**
 * Доступ к основным экранам приложения: демо (флаг) или зарегистрированный пользователь (JWT + не гость в /api/auth/me).
 * Иначе — редирект на страницу входа с параметром next.
 */
export function RequireAppAccess({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<GateStatus>(accessFromSession);

  const returnPath = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    let cancelled = false;
    let gen = 0;

    function run() {
      if (isDemoModeActive()) {
        gen += 1;
        if (!cancelled) {
          setStatus("ok");
        }
        return;
      }

      const token = getAuthToken();
      if (!token || isJwtExpired(token)) {
        gen += 1;
        if (!cancelled) {
          setStatus("denied");
        }
        return;
      }

      const myGen = ++gen;
      if (!cancelled) {
        setStatus("loading");
      }

      fetchMe()
        .then((user) => {
          if (cancelled || myGen !== gen) {
            return;
          }
          if (isDemoModeActive()) {
            setStatus("ok");
            return;
          }
          setStatus(user.guest === false ? "ok" : "denied");
        })
        .catch(() => {
          if (cancelled || myGen !== gen) {
            return;
          }
          clearAuthToken();
          notifyAuthChanged();
          setStatus("denied");
        });
    }

    run();
    const unsub = subscribeAuthChanged(run);
    return () => {
      cancelled = true;
      gen += 1;
      unsub();
    };
  }, [location.pathname, location.search, location.hash]);

  if (status === "loading") {
    return (
      <div className="auth-page landing-gate" aria-busy="true" aria-live="polite">
        <p className="landing-gate-text">Загрузка…</p>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to={loginHref(returnPath)} replace />;
  }

  return <>{children}</>;
}
