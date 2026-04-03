import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CHALLENGE_TRACKS, NEWCOMER_COMPLETION_THRESHOLD } from "../challengeTracks";
import type { TrackAccent } from "../challengeTracks";
import { buildRoadPathD, buildRoadPoints } from "../roadmapPath";
import { fetchPlayerState, fetchScenarios } from "../api";
import type { ScenarioSummary } from "../types";

function accentClass(a: string): string {
  if (a === "mint") {
    return "quest-track--mint";
  }
  if (a === "lilac") {
    return "quest-track--lilac";
  }
  if (a === "yellow") {
    return "quest-track--yellow";
  }
  return "quest-track--orange";
}

function MapPinIcon({ className, fill }: { className?: string; fill: string }) {
  return (
    <svg className={className} viewBox="0 0 32 40" width="32" height="40" aria-hidden>
      <path
        fill={fill}
        stroke="#0a0a0a"
        strokeWidth="2.25"
        strokeLinejoin="round"
        d="M16 2c-5.5 0-10 4.2-10 9.4 0 6.8 10 22.6 10 22.6S26 18.2 26 11.4C26 6.2 21.5 2 16 2z"
      />
      <circle cx="16" cy="12" r="4" fill="#fff" stroke="#0a0a0a" strokeWidth="1.5" />
    </svg>
  );
}

function RoadmapTrack({
  accent,
  scenarioIds,
  byId,
  completedIds,
}: {
  accent: TrackAccent;
  scenarioIds: string[];
  byId: Map<string, ScenarioSummary>;
  completedIds: Set<string>;
}) {
  const steps = scenarioIds
    .map((id) => ({ id, scenario: byId.get(id) }))
    .filter((x): x is { id: string; scenario: ScenarioSummary } => x.scenario != null);

  if (steps.length === 0) {
    return <p className="quest-roadmap-empty">Сценарии дорожки пока недоступны.</p>;
  }

  const points = useMemo(() => buildRoadPoints(steps.length), [steps.length]);
  const pathD = useMemo(() => buildRoadPathD(points), [points]);
  const mapHeightPx = Math.max(300, steps.length * 128);
  const roadFilterId = useId().replace(/:/g, "");

  return (
    <div
      className={`quest-roadmap quest-roadmap--islands quest-roadmap--accent-${accent}`}
      role="list"
      style={{ minHeight: mapHeightPx }}
    >
      <svg
        className="quest-roadmap-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <filter id={roadFilterId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="0.5" floodColor="#0a0a0a" floodOpacity="0.22" />
          </filter>
        </defs>
        {steps.length >= 2 ? (
          <path
            className="quest-roadmap-path"
            d={pathD}
            fill="none"
            vectorEffect="non-scaling-stroke"
            filter={`url(#${roadFilterId})`}
          />
        ) : (
          <circle className="quest-roadmap-path quest-roadmap-path--dot" cx="50" cy="50" r="2.8" />
        )}
      </svg>

      <ol className="quest-roadmap-stops" style={{ minHeight: mapHeightPx }}>
        {steps.map(({ id: sid, scenario: s }, index) => {
          const completed = completedIds.has(sid);
          const locked = s.locked;
          const state = locked ? "locked" : completed ? "done" : "open";
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const isLeft = index % 2 === 0;
          const py = points[index]?.y ?? 50;
          const stopAlign =
            steps.length === 1 ? "solo" : isLeft ? "left" : "right";

          return (
            <li
              key={sid}
              className={`quest-roadmap-stop quest-roadmap-stop--${stopAlign}`}
              style={{ top: `${py}%` }}
            >
              <div className={`quest-island quest-island--${state}`}>
                <span className="quest-island-shore" aria-hidden />
                {steps.length === 1 ? (
                  <span className="quest-island-pin quest-island-pin--solo" title="Маршрут">
                    <MapPinIcon fill="var(--bento-yellow)" />
                    <span className="quest-island-pin-label">Маршрут</span>
                  </span>
                ) : (
                  <>
                    {isFirst ? (
                      <span className="quest-island-pin quest-island-pin--start" title="Старт">
                        <MapPinIcon fill="var(--bento-orange)" />
                        <span className="quest-island-pin-label">Старт</span>
                      </span>
                    ) : null}
                    {isLast ? (
                      <span className="quest-island-pin quest-island-pin--end" title="Финиш">
                        <MapPinIcon fill="var(--bento-yellow)" />
                        <span className="quest-island-pin-label">Финиш</span>
                      </span>
                    ) : null}
                  </>
                )}
                <article className={`quest-node quest-node--island quest-node--${state}`}>
                  <div className="quest-node-badge" aria-hidden>
                    {index + 1}
                  </div>
                  <div className="quest-node-main">
                    <span className="quest-node-kicker">Этап {index + 1}</span>
                    <h3 className="quest-node-title">{s.title}</h3>
                    <span className="quest-node-hint">
                      {locked ? "Нужна роль" : completed ? "Пройдено" : "Доступно"}
                    </span>
                  </div>
                  {locked ? (
                    <span className="quest-node-action quest-node-action--muted">Заблокировано</span>
                  ) : (
                    <Link to={`/play/${encodeURIComponent(sid)}`} className="quest-node-action btn btn-secondary">
                      Играть
                    </Link>
                  )}
                </article>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ChallengesPage() {
  const [items, setItems] = useState<ScenarioSummary[] | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [player, data] = await Promise.all([fetchPlayerState(), fetchScenarios()]);
        if (cancelled) {
          return;
        }
        setItems(data);
        setCompletedIds(new Set(player.completedScenarioIds));
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

  const byId = useMemo(() => {
    const m = new Map<string, ScenarioSummary>();
    if (items) {
      for (const s of items) {
        m.set(s.id, s);
      }
    }
    return m;
  }, [items]);

  return (
    <div className="challenges-page">
      <header className="challenges-hero">
        <h1 className="page-title challenges-title">Челленджи</h1>
        <p className="page-subtitle challenges-lead">
          Тематические дорожки — как Quest на LeetCode: идите по шагам внутри темы или перескакивайте к любому
          доступному сценарию с дашборда.
        </p>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      {items === null && !error ? <div className="skeleton challenges-skeleton" aria-busy /> : null}

      {items ? (
        <div className="quest-track-list">
          {CHALLENGE_TRACKS.map((track) => {
            const total = track.scenarioIds.length;
            const done = track.scenarioIds.filter((id) => completedIds.has(id)).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const showNewcomerHint =
              Boolean(track.recommendedForNewcomers) && completedIds.size < NEWCOMER_COMPLETION_THRESHOLD;

            return (
              <section
                key={track.id}
                className={`quest-track ${accentClass(track.accent)}${showNewcomerHint ? " quest-track--recommended" : ""}`}
                aria-labelledby={`track-${track.id}`}
              >
                <div className="quest-track-head">
                  {showNewcomerHint ? (
                    <span className="quest-track-newcomer-badge" title="Рекомендация для старта">
                      Начните с этой дорожки
                    </span>
                  ) : null}
                  <h2 id={`track-${track.id}`} className="quest-track-title">
                    {track.title}
                  </h2>
                  <p className="quest-track-desc">{track.description}</p>
                  <div className="quest-track-meta" aria-live="polite">
                    <div className="quest-track-progress-row">
                      <span className="quest-track-progress">
                        Пройдено: <strong>{done}</strong> / {total}{" "}
                        <span className="quest-track-progress-pct">({pct}%)</span>
                      </span>
                    </div>
                    <div className="quest-track-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Прогресс дорожки: ${pct} процентов`}>
                      <div className="quest-track-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <RoadmapTrack accent={track.accent} scenarioIds={track.scenarioIds} byId={byId} completedIds={completedIds} />
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
