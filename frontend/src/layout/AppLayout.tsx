import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
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
            <a href="/#workdesk" className="app-nav-pill">
              Сценарии
            </a>
            <a href="/#workdesk" className="app-nav-pill app-nav-pill--primary">
              {isHome ? "Начать" : "К задачам"}
            </a>
          </nav>
        </div>
      </header>
      <main className={isHome ? "main main--bento" : "main main--bento main--bento-padded"}>{children}</main>
    </div>
  );
}
