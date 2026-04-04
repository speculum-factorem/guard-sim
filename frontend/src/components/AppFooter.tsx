import { Link } from "react-router-dom";
import { canUseAppRoutes } from "../demoMode";
import { useUserMe } from "../hooks/useUserMe";
import { DASHBOARD_TASKS_HREF, loginHref } from "../navigationConstants";
import { SITE_NAME } from "../siteMeta";

export function AppFooter() {
  const { me } = useUserMe();
  const ok = canUseAppRoutes(me);
  const dash = ok ? "/dashboard" : loginHref("/dashboard");
  const challenges = ok ? "/challenges" : loginHref("/challenges");
  const account = ok ? "/account" : loginHref("/account");
  const tasks = ok ? DASHBOARD_TASKS_HREF : loginHref(DASHBOARD_TASKS_HREF);

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <span className="app-footer-name">{SITE_NAME}</span>
          <span className="app-footer-tagline">учебный симулятор кибергигиены</span>
        </div>
        <nav className="app-footer-nav" aria-label="Нижняя навигация">
          <Link to="/" className="app-footer-link">
            Главная
          </Link>
          <Link to={dash} className="app-footer-link">
            Дашборд
          </Link>
          <Link to={challenges} className="app-footer-link">
            Челленджи
          </Link>
          <Link to={account} className="app-footer-link">
            Профиль
          </Link>
          <Link to={tasks} className="app-footer-link">
            Задачи
          </Link>
        </nav>
        <p className="app-footer-copy">© {new Date().getFullYear()} {SITE_NAME}. Учебный проект.</p>
      </div>
    </footer>
  );
}
