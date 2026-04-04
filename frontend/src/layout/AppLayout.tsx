import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMe } from "../api";
import { notifyAuthChanged, subscribeAuthChanged } from "../authEvents";
import { clearAuthToken, getAuthToken } from "../authToken";
import { AppFooter } from "../components/AppFooter";
import { LogoMark } from "../components/LogoMark";
import { canUseAppRoutes } from "../demoMode";
import { DASHBOARD_TASKS_HREF, loginHref } from "../navigationConstants";
import { SITE_NAME } from "../siteMeta";
import type { UserMe } from "../types";

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard";
  const isChallenges = pathname === "/challenges";
  const isPlay = pathname.startsWith("/play/");
  const isLogin = pathname === "/login";
  const isRegister = pathname === "/register";
  const isAccount = pathname === "/account";
  const [me, setMe] = useState<UserMe | null>(null);

  useEffect(() => {
    let gen = 0;
    function syncMe() {
      const my = ++gen;
      fetchMe()
        .then((m) => {
          if (my === gen) {
            setMe(m);
          }
        })
        .catch(() => {
          if (my === gen) {
            if (getAuthToken()) {
              clearAuthToken();
              notifyAuthChanged();
            }
            setMe(null);
          }
        });
    }
    syncMe();
    const unsub = subscribeAuthChanged(syncMe);
    return () => {
      gen += 1;
      unsub();
    };
  }, []);

  const registered = Boolean(me && !me.guest);
  const appUnlocked = canUseAppRoutes(me);

  const navTo = (path: string) => (appUnlocked ? path : loginHref(path));

  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="app-bar-track" aria-hidden />
        <div className="app-bar-inner">
          <Link to="/" className="app-logo" aria-label={`${SITE_NAME} — на главную`}>
            <LogoMark className="app-logo-mark-svg" size={40} title={SITE_NAME} />
            <span className="app-logo-text">{SITE_NAME}</span>
          </Link>

          <nav className="app-nav" aria-label="Основная навигация">
            <Link
              to={navTo("/dashboard")}
              className={`app-nav-pill${isDashboard ? " app-nav-pill--active" : ""}`}
              aria-current={isDashboard ? "page" : undefined}
            >
              Дашборд
            </Link>
            <Link
              to={navTo("/challenges")}
              className={`app-nav-pill${isChallenges ? " app-nav-pill--active" : ""}`}
              aria-current={isChallenges ? "page" : undefined}
            >
              Челленджи
            </Link>
            <Link
              to={navTo(DASHBOARD_TASKS_HREF)}
              className={`app-nav-pill app-nav-pill--primary${isPlay ? " app-nav-pill--active" : ""}`}
              aria-current={isPlay ? "page" : undefined}
            >
              {isHome ? "Играть" : "К задачам"}
            </Link>
            {!registered ? (
              <Link
                to={navTo("/account")}
                className={`app-nav-pill${isAccount ? " app-nav-pill--active" : ""}`}
                aria-current={isAccount ? "page" : undefined}
              >
                Профиль
              </Link>
            ) : null}
          </nav>

          <div className="app-bar-aside">
            {registered && me ? (
              <Link
                to="/account"
                className={`app-user-chip${isAccount ? " app-user-chip--active" : ""}`}
                title={me.email ?? "Профиль"}
                aria-current={isAccount ? "page" : undefined}
              >
                <span className="app-user-chip-avatar" aria-hidden>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span className="app-user-chip-email">{me.email ?? "Аккаунт"}</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`app-nav-pill${isLogin ? " app-nav-pill--active" : ""}`}
                  aria-current={isLogin ? "page" : undefined}
                >
                  Вход
                </Link>
                <Link
                  to="/register"
                  className={`app-nav-pill app-nav-pill--secondary${isRegister ? " app-nav-pill--active" : ""}`}
                  aria-current={isRegister ? "page" : undefined}
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className={isHome ? "main main--bento" : "main main--bento main--bento-padded"}>{children}</main>
      <AppFooter />
    </div>
  );
}
