import { Link } from "react-router-dom";
import { CHALLENGE_TRACKS } from "../challengeTracks";
import { getNextIncompleteTrackStep } from "../challengeTrackProgress";
import type { PlayerState, ScenarioSummary } from "../types";

export function ContinueTrackHint(props: { items: ScenarioSummary[]; player: PlayerState }) {
  const { items, player } = props;
  const byId = new Map(items.map((s) => [s.id, s]));
  const completed = new Set(player.completedScenarioIds);

  const next = getNextIncompleteTrackStep(CHALLENGE_TRACKS, completed, byId);

  if (!next) {
    return null;
  }

  const { track, scenario, stepNumber } = next;

  return (
    <section className="continue-track-hint" aria-labelledby="continue-track-heading">
      <div className="continue-track-hint-inner">
        <div className="continue-track-hint-copy">
          <h2 id="continue-track-heading" className="continue-track-hint-title">
            Продолжить дорожку «{track.title}»
          </h2>
          <p className="continue-track-hint-meta">
            Следующий этап ({stepNumber}/{track.scenarioIds.length}): <strong>{scenario.title}</strong>
          </p>
        </div>
        <div className="continue-track-hint-actions">
          <Link to={`/play/${encodeURIComponent(scenario.id)}`} className="btn btn-primary continue-track-hint-btn">
            Играть
          </Link>
          <Link to="/challenges" className="continue-track-hint-link">
            Все дорожки
          </Link>
        </div>
      </div>
    </section>
  );
}
