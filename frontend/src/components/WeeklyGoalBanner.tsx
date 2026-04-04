import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DASHBOARD_TASKS_HREF } from "../navigationConstants";
import { resolveWeeklyGoal } from "../weeklyGoalStorage";
import type { PlayerState } from "../types";

export function WeeklyGoalBanner({ player }: { player: PlayerState }) {
  const sortedIdsKey = [...player.completedScenarioIds].sort().join("|");
  const { current, target } = useMemo(() => resolveWeeklyGoal(player), [sortedIdsKey, player]);

  const pct = Math.min(100, target > 0 ? Math.round((current / target) * 100) : 0);
  const done = current >= target;

  return (
    <section
      className={`weekly-goal-banner${done ? " weekly-goal-banner--done" : ""}`}
      aria-labelledby="weekly-goal-heading"
    >
      <div className="weekly-goal-banner-inner">
        <div className="weekly-goal-banner-copy">
          <h2 id="weekly-goal-heading" className="weekly-goal-banner-title">
            Цель недели
          </h2>
          <p className="weekly-goal-banner-text">
            {done ? (
              <>
                Отлично: вы закрыли <strong>{target}</strong>{" "}
                {target === 1 ? "новый сценарий" : "новых сценария"} на этой неделе.
              </>
            ) : (
              <>
                Пройдите ещё <strong>{Math.max(0, target - current)}</strong> из {target} сценариев на этой неделе —
                счёт обновляется при завершении миссий.
              </>
            )}
          </p>
          <p className="weekly-goal-banner-meta" aria-live="polite">
            <span className="weekly-goal-banner-count">
              {current} / {target}
            </span>
            <span className="weekly-goal-banner-pct">{pct}%</span>
          </p>
          <div className="weekly-goal-bar" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={current} aria-label="Прогресс недельной цели">
            <div className="weekly-goal-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Link to={DASHBOARD_TASKS_HREF} className="btn btn-secondary weekly-goal-banner-link">
          К задачам
        </Link>
      </div>
    </section>
  );
}
