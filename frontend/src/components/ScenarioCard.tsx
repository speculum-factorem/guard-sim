import { Link } from "react-router-dom";
import type { ScenarioSummary } from "../types";
import { typeClass, typeLabel } from "../scenarioHub";

export function ScenarioCard({ s }: { s: ScenarioSummary }) {
  return (
    <article className="hub-scenario-card">
      <span className={`card-badge ${typeClass(s.type)}`}>{typeLabel(s.type)}</span>
      <h3 className="hub-scenario-title">{s.title}</h3>
      <p className="hub-scenario-desc">{s.description}</p>
      <Link to={`/play/${encodeURIComponent(s.id)}`} className="btn btn-primary hub-scenario-open">
        Открыть
      </Link>
    </article>
  );
}
