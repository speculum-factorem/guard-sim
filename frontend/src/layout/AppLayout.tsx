import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppFooter } from "../components/AppFooter";
import { LogoMark } from "../components/LogoMark";

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

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
          </nav>
        </div>
      </header>
      <main className={isHome ? "main main--bento" : "main main--bento main--bento-padded"}>{children}</main>
      <AppFooter />
    </div>
  );
}
