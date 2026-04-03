import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="app-bar-inner">
          <Link to="/" className="app-logo">
            <span className="app-logo-mark" aria-hidden />
            <span className="app-logo-text">GuardSim</span>
          </Link>
          <nav className="app-nav" aria-label="Основная навигация">
            <Link to="/" className="app-nav-link">
              Сценарии
            </Link>
            <a href="/#workdesk" className="btn btn-primary btn-nav-cta">
              Начать
            </a>
          </nav>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
