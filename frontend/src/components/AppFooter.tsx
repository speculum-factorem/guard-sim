import { Link } from "react-router-dom";
import { DASHBOARD_TASKS_HREF } from "../navigationConstants";

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
          <Link to="/challenges" className="app-footer-link">
            Челленджи
          </Link>
          <Link to="/account" className="app-footer-link">
            Профиль
          </Link>
          <Link to={DASHBOARD_TASKS_HREF} className="app-footer-link">
            Задачи
          </Link>
        </nav>
        <p className="app-footer-copy">© {new Date().getFullYear()} GuardSim. Учебный проект.</p>
      </div>
    </footer>
  );
}
