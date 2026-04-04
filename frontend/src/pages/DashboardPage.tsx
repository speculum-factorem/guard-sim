import { useEffect, useMemo, useState } from "react";
import { fetchPlayerState, fetchScenarios } from "../api";
import { CareerAchievementsPanel } from "../components/CareerAchievementsPanel";
import { ContinueTrackHint } from "../components/ContinueTrackHint";
import { GuardsimOnboardingBanner } from "../components/GuardsimOnboardingBanner";
import { WeeklyGoalBanner } from "../components/WeeklyGoalBanner";
import { WorkdeskMonitor } from "../components/WorkdeskMonitor";
import { firstOpenScenarioId, splitScenariosByColumn } from "../scenarioHub";
import type { PlayerState, ScenarioSummary } from "../types";

export function DashboardPage() {
  const [items, setItems] = useState<ScenarioSummary[] | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(() => {
    if (!items) {
      return { mail: [] as ScenarioSummary[], social: [] as ScenarioSummary[], security: [] as ScenarioSummary[] };
    }
    return splitScenariosByColumn(items);
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, data] = await Promise.all([fetchPlayerState(), fetchScenarios()]);
        if (cancelled) {
          return;
        }
        setPlayer(p);
        setItems(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Не удалось загрузить данные");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const quickStartId = useMemo(() => firstOpenScenarioId(columns), [columns]);

  const progressStats = useMemo(() => {
    if (!items || !player) {
      return null;
    }
    const total = items.length;
    const solved = player.completedScenarioIds.filter((id) => items.some((s) => s.id === id)).length;
    const pct = total === 0 ? 0 : Math.round((solved / total) * 100);
    return { total, solved, pct };
  }, [items, player]);

  return (
    <div className="dashboard-page dashboard-page--lc lc-theme">
      <div className="lc-dashboard-shell">
        <header className="lc-dashboard-hero">
          <div className="lc-dashboard-hero-main">
            <h1 className="lc-dashboard-title">Каталог задач</h1>
            <p className="lc-dashboard-lead">
              Интерактивные сценарии в духе реальных инцидентов. Фильтры и сортировка сохраняются в браузере.
              {quickStartId ? (
                <>
                  {" "}
                  Начните с первой доступной задачи в таблице ниже.
                </>
              ) : null}
            </p>
          </div>
          {progressStats ? (
            <ul className="lc-dashboard-stats" aria-label="Сводка по прогрессу">
              <li className="lc-stat-card">
                <span className="lc-stat-value">{progressStats.solved}</span>
                <span className="lc-stat-label">Решено</span>
              </li>
              <li className="lc-stat-card">
                <span className="lc-stat-value">{progressStats.total}</span>
                <span className="lc-stat-label">Всего</span>
              </li>
              <li className="lc-stat-card lc-stat-card--accent">
                <span className="lc-stat-value">{progressStats.pct}%</span>
                <span className="lc-stat-label">Прогресс</span>
              </li>
            </ul>
          ) : null}
        </header>

        {error ? <div className="error-banner lc-dashboard-error">{error}</div> : null}

        {items && player ? <ContinueTrackHint items={items} player={player} /> : null}

        {items === null && !error ? (
          <div className="skeleton lc-dashboard-table-skeleton" aria-busy />
        ) : null}

        {items ? (
          <WorkdeskMonitor items={items} completedIds={player?.completedScenarioIds ?? []} />
        ) : null}

        <div className="lc-dashboard-below">
          {player ? <WeeklyGoalBanner player={player} /> : null}
          {player ? <CareerAchievementsPanel player={player} /> : null}
          <GuardsimOnboardingBanner />
        </div>
      </div>
    </div>
  );
}
