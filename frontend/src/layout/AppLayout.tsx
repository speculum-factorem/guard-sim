import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMe } from "../api";
import { clearAuthToken, getAuthToken } from "../authToken";
import { AppFooter } from "../components/AppFooter";
import { LogoMark } from "../components/LogoMark";
import type { UserMe } from "../types";

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === "/";
  const [me, setMe] = useState<UserMe | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      setMe(null);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((m) => {
        if (!cancelled) {
          setMe(m);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthToken();
          setMe(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function logout() {
    clearAuthToken();
    setMe(null);
    navigate("/", { replace: true });
  }

  const loggedIn = Boolean(me && !me.guest && me.email);

  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="app-bar-inner">
          <Link to="/" className="app-logo">
            <LogoMark className="app-logo-mark-svg" size={40} />
            <span className="app-logo-text">GuardSim</span>
          </Link>
          <nav className="app-nav" aria-label="Основная навигация">
            <Link to="/" className="app-nav-pill">
              Главная
            </Link>
            <Link to="/dashboard" className="app-nav-pill">
              Дашборд
            </Link>
            <Link to="/challenges" className="app-nav-pill">
              Челленджи
            </Link>
            <Link to="/dashboard#tasks" className="app-nav-pill app-nav-pill--primary">
              {isHome ? "Начать" : "К задачам"}
            </Link>
            {loggedIn ? (
              <span className="app-nav-auth">
                <span className="app-nav-email" title={me?.email ?? ""}>
                  {me?.email}
                </span>
                <button type="button" className="app-nav-pill app-nav-pill--ghost" onClick={logout}>
                  Выйти
                </button>
              </span>
            ) : (
              <>
                <Link to="/login" className="app-nav-pill">
                  Вход
                </Link>
                <Link to="/register" className="app-nav-pill app-nav-pill--secondary">
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className={isHome ? "main main--bento" : "main main--bento main--bento-padded"}>{children}</main>
      <AppFooter />
    </div>
  );
}
