import { Link } from "react-router-dom";
import { careerTitle } from "../careerLabels";
import type { ScenarioSummary } from "../types";
import { typeClass, typeLabel } from "../scenarioHub";

export function ScenarioCard({ s }: { s: ScenarioSummary }) {
  return (
    <article className={`hub-scenario-card${s.locked ? " hub-scenario-card-locked" : ""}`}>
      <span className={`card-badge ${typeClass(s.type)}`}>{typeLabel(s.type)}</span>
      {s.locked ? (
        <span className="card-lock-hint">Нужна роль: {careerTitle(s.requiredRole)}</span>
      ) : null}
      <h3 className="hub-scenario-title">{s.title}</h3>
      <p className="hub-scenario-desc">{s.description}</p>
      {s.locked ? (
        <span className="btn btn-primary hub-scenario-btn-disabled" aria-disabled>
          Заблокировано
        </span>
      ) : (
        <Link to={`/play/${encodeURIComponent(s.id)}`} className="btn btn-primary hub-scenario-open">
          Открыть
        </Link>
      )}
    </article>
  );
}
