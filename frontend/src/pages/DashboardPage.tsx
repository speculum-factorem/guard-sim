import { useEffect, useMemo, useState } from "react";
import { fetchPlayerState, fetchScenarios } from "../api";
import { CareerAchievementsPanel } from "../components/CareerAchievementsPanel";
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

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="page-title dashboard-title">Дашборд</h1>
        <p className="page-subtitle dashboard-subtitle">
          Репутация, достижения и список учебных сценариев.
          {quickStartId ? (
            <>
              {" "}
              Быстрый старт: откройте первый доступный сценарий из списка ниже.
            </>
          ) : null}
        </p>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      {player ? <CareerAchievementsPanel player={player} /> : null}

      {items === null && !error ? <div className="skeleton dashboard-skeleton" aria-busy /> : null}

      {items ? <WorkdeskMonitor items={items} completedIds={player?.completedScenarioIds ?? []} /> : null}
    </div>
  );
}
