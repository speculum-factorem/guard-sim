import { Link } from "react-router-dom";

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <span className="app-footer-name">GuardSim</span>
          <span className="app-footer-tagline">учебный симулятор кибергигиены</span>
        </div>
        <nav className="app-footer-nav" aria-label="Нижняя навигация">
          <Link to="/" className="app-footer-link">
            Главная
          </Link>
          <Link to="/dashboard" className="app-footer-link">
            Дашборд
          </Link>
          <Link to="/dashboard#tasks" className="app-footer-link">
            Задачи
          </Link>
        </nav>
        <p className="app-footer-copy">© {new Date().getFullYear()} GuardSim. Учебный проект.</p>
      </div>
    </footer>
  );
}
