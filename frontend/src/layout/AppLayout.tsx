import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMe } from "../api";
import { notifyAuthChanged, subscribeAuthChanged } from "../authEvents";
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
    let gen = 0;
    function syncMe() {
      const my = ++gen;
      if (!getAuthToken()) {
        setMe(null);
        return;
      }
      fetchMe()
        .then((m) => {
          if (my === gen) setMe(m);
        })
        .catch(() => {
          if (my === gen) {
            clearAuthToken();
            setMe(null);
            notifyAuthChanged();
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

  function logout() {
    clearAuthToken();
    notifyAuthChanged();
    navigate("/", { replace: true });
  }

  const loggedIn = Boolean(me && !me.guest);

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
