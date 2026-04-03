import { useState } from "react";
import { Link } from "react-router-dom";
import { dismissOnboarding, isOnboardingDismissed } from "../onboardingStorage";

export function GuardsimOnboardingBanner() {
  const [open, setOpen] = useState(() => !isOnboardingDismissed());

  if (!open) {
    return null;
  }

  function handleDismiss() {
    dismissOnboarding();
    setOpen(false);
  }

  return (
    <div className="gs-onboarding-banner" role="region" aria-label="Как устроены челленджи и цель недели">
      <div className="gs-onboarding-inner">
        <div className="gs-onboarding-copy">
          <h2 className="gs-onboarding-title">Как пользоваться GuardSim</h2>
          <ul className="gs-onboarding-list">
            <li>
              <strong>Челленджи</strong> — тематические дорожки сценариев; удобно идти по шагам. Откройте раздел{" "}
              <Link to="/challenges">Челленджи</Link>
              .
            </li>
            <li>
              <strong>Цель недели</strong> на дашборде считает новые прохождения локально в браузере (без отправки на
              сервер): обновляется, когда в списке пройденных появляются новые сценарии.
            </li>
            <li>
              Фильтры в списке <Link to="/dashboard#tasks">задач</Link> можно сохранить — они запоминаются на этом
              устройстве.
            </li>
          </ul>
        </div>
        <button type="button" className="btn btn-primary gs-onboarding-dismiss" onClick={handleDismiss}>
          Понятно
        </button>
      </div>
    </div>
  );
}
