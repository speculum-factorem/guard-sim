import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { careerTitle } from "../careerLabels";
import { StepSimulation } from "../components/simulation/StepSimulation";
import { fetchScenario, startSession, submitAnswer } from "../api";
import type {
  AnswerResponse,
  CareerSnapshot,
  ChoicePublic,
  ScenarioDetail,
  ScenarioType,
  StepPublic,
} from "../types";

function scenarioTypeLabel(t: ScenarioType): string {
  return t === "EMAIL" ? "Почта" : "Лента";
}

function hotspotChoiceIds(step: StepPublic): Set<string> {
  return new Set(step.hotspots.map((h) => h.choiceId));
}

function fallbackChoices(step: StepPublic): ChoicePublic[] {
  const fromHotspots = hotspotChoiceIds(step);
  const game = step.urlCompareGame;
  return step.choices.filter((c) => {
    if (fromHotspots.has(c.id)) return false;
    if (game && (c.id === game.leftChoiceId || c.id === game.rightChoiceId)) return false;
    return true;
  });
}

function missionWindowLabel(step: StepPublic): string {
  switch (step.uiKind) {
    case "EMAIL_CLIENT":
      return "Почтовый клиент";
    case "SOCIAL_NOTIFICATION":
      return "Лента соцсети";
    case "DESK_TICKET":
      return "Тикет ИБ";
    case "MINI_URL_COMPARE":
      return "Окно браузера";
    default:
      return "Задание";
  }
}

function missionBriefText(step: StepPublic): string {
  const raw = step.situationBrief?.trim();
  if (raw) {
    return raw;
  }
  switch (step.uiKind) {
    case "EMAIL_CLIENT":
      return "Вы смотрите входящее письмо в почтовом клиенте. Ниже — то, что видно на экране: тема, отправитель и действия.";
    case "SOCIAL_NOTIFICATION":
      return "Открыта лента соцсети. Ниже — пост и элементы, как в мобильном или веб-интерфейсе.";
    case "DESK_TICKET":
      return "Открыт тикет в системе информационной безопасности. Ниже — описание и интерактивные элементы.";
    case "MINI_URL_COMPARE":
      return "Нужно оценить адреса так, как в браузере перед переходом. Ниже — два варианта и подсказки.";
    default:
      return "Прочитайте условие и выберите действие.";
  }
}

function MissionWindow(props: { children: ReactNode; bodyClassName?: string }) {
  const { children, bodyClassName } = props;
  return (
    <div className="mission-window">
      <div className={bodyClassName ? `mission-window-body ${bodyClassName}` : "mission-window-body"}>
        {children}
      </div>
    </div>
  );
}

function PressureTimer({
  totalSeconds,
  stepId,
  frozen,
}: {
  totalSeconds: number | null | undefined;
  stepId: string;
  frozen: boolean;
}) {
  const [left, setLeft] = useState(totalSeconds ?? 0);

  useEffect(() => {
    setLeft(totalSeconds ?? 0);
  }, [stepId, totalSeconds]);

  useEffect(() => {
    if (frozen || !totalSeconds || totalSeconds <= 0) {
      return;
    }
    const id = window.setInterval(() => {
      setLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [totalSeconds, stepId, frozen]);

  if (!totalSeconds || totalSeconds <= 0) {
    return null;
  }

  const expired = left === 0;
  const pct = totalSeconds > 0 ? Math.min(100, (left / totalSeconds) * 100) : 0;

  return (
    <div className={`pressure-bar-wrap${expired ? " pressure-expired" : ""}`}>
      <div className="pressure-bar-head">
        <span className="pressure-bar-label">Условное время на шаг</span>
        <span className="pressure-bar-seconds" aria-live="polite">
          {left} с
        </span>
      </div>
      <div className="pressure-bar-track" aria-hidden>
        <div className="pressure-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {expired ? (
        <p className="pressure-relaxed">
          Таймер остановлен — в жизни такое письмо могли уже открыть. Вы всё ещё можете завершить шаг спокойно: за
          «опоздание» штрафа нет.
        </p>
      ) : (
        <p className="pressure-hint">Это имитация спешки, а не экзамен на скорость.</p>
      )}
    </div>
  );
}

function RedFlagPicker(props: {
  game: NonNullable<StepPublic["redFlagGame"]>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
}) {
  const { game, selectedIds, onChange, disabled } = props;
  const max = game.requiredPickCount;

  const toggle = (id: string) => {
    if (disabled) {
      return;
    }
    const set = new Set(selectedIds);
    if (set.has(id)) {
      set.delete(id);
    } else {
      if (set.size >= max) {
        return;
      }
      set.add(id);
    }
    onChange([...set]);
  };

  return (
    <div className="red-flag-game">
      <p className="red-flag-instruction">{game.instruction}</p>
      <div className="red-flag-chips" role="group" aria-label="Подозрительные признаки">
        {game.candidates.map((c) => {
          const on = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className={`red-flag-chip${on ? " red-flag-chip-on" : ""}`}
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(c.id)}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <p className="red-flag-progress">
        Отмечено: {selectedIds.length} / {max}
        {selectedIds.length === max ? " — можно действовать" : " — снимите лишнее или выберите ещё"}
      </p>
    </div>
  );
}

function InvestigationDock(props: {
  step: StepPublic;
  disabled: boolean;
  viewedIds: string[];
  onViewPanel: (id: string) => void;
}) {
  const { step, disabled, viewedIds, onViewPanel } = props;
  const [activeId, setActiveId] = useState<string | null>(null);
  const panels = step.investigationPanels;

  useEffect(() => {
    setActiveId(null);
  }, [step.id]);

  if (panels.length === 0) {
    return null;
  }
  const activeBody = activeId ? panels.find((p) => p.id === activeId)?.body : null;

  return (
    <div className="investigation-dock">
      <div className="investigation-dock-head">
        <span className="investigation-dock-title">Расследование</span>
        {step.investigationBonusThreshold > 0 ? (
          <span className="investigation-dock-hint">
            Осмотр влияет на доверие при верном ответе
          </span>
        ) : null}
      </div>
      <div className="investigation-tabs" role="tablist">
        {panels.map((p) => {
          const viewed = viewedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={activeId === p.id}
              className={`investigation-tab${viewed ? " investigation-tab-viewed" : ""}${
                activeId === p.id ? " investigation-tab-active" : ""
              }`}
              disabled={disabled}
              onClick={() => {
                onViewPanel(p.id);
                setActiveId(p.id);
              }}
            >
              {p.title}
              {viewed ? <span className="inv-viewed-mark" aria-hidden> ✓</span> : null}
            </button>
          );
        })}
      </div>
      <div className="investigation-panel-body" role="tabpanel">
        {activeBody != null ? (
          <p className="investigation-panel-text">{activeBody}</p>
        ) : (
          <p className="investigation-panel-placeholder">Откройте вкладку, чтобы прочитать материал осмотра</p>
        )}
      </div>
    </div>
  );
}

export function SimulationPage() {
  const { scenarioId: scenarioIdParam } = useParams();
  const scenarioId = scenarioIdParam ?? "";

  const [detail, setDetail] = useState<ScenarioDetail | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<StepPublic | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingNext, setPendingNext] = useState<StepPublic | null>(null);
  const [careerHud, setCareerHud] = useState<CareerSnapshot | null>(null);
  const [lastAchievementToast, setLastAchievementToast] = useState<string | null>(null);
  const [viewedInvestigationIds, setViewedInvestigationIds] = useState<string[]>([]);
  const [consequenceModal, setConsequenceModal] = useState<string | null>(null);
  const [lastInvestigationRepDelta, setLastInvestigationRepDelta] = useState<number | null>(null);
  const [redFlagSelectionIds, setRedFlagSelectionIds] = useState<string[]>([]);

  const pendingAfterConsequenceRef = useRef<AnswerResponse | null>(null);

  useEffect(() => {
    setViewedInvestigationIds([]);
    setLastInvestigationRepDelta(null);
    setRedFlagSelectionIds([]);
  }, [step?.id]);

  useEffect(() => {
    if (!scenarioId) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchScenario(scenarioId);
        if (cancelled) {
          return;
        }
        setDetail(d);
        const start = await startSession(scenarioId);
        if (cancelled) {
          return;
        }
        setSessionId(start.sessionId);
        setStep(start.currentStep);
        setStepIndex(start.stepIndex);
        setTotalSteps(start.totalSteps);
        setScore(0);
        setCompleted(false);
        setFeedback(null);
        setPendingNext(null);
        setCareerHud(null);
        setLastAchievementToast(null);
        setConsequenceModal(null);
        pendingAfterConsequenceRef.current = null;
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Ошибка загрузки");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  const markPanelViewed = useCallback((id: string) => {
    setViewedInvestigationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const finishAnswerFlow = useCallback((res: AnswerResponse) => {
    setFeedback({ ok: res.correct, text: res.explanation });
    setScore(res.totalScore);
    setCompleted(res.completed);
    setStepIndex(res.stepIndex);
    setTotalSteps(res.totalSteps);
    if (res.completed) {
      setPendingNext(null);
      setStep(null);
    } else if (res.nextStep) {
      setPendingNext(res.nextStep);
    }
  }, []);

  const onContinue = useCallback(() => {
    if (!pendingNext) {
      return;
    }
    setStep(pendingNext);
    setPendingNext(null);
    setFeedback(null);
  }, [pendingNext]);

  const onConsequenceAck = useCallback(() => {
    const res = pendingAfterConsequenceRef.current;
    pendingAfterConsequenceRef.current = null;
    setConsequenceModal(null);
    if (res) {
      finishAnswerFlow(res);
    }
  }, [finishAnswerFlow]);

  const onChoose = useCallback(
    async (choiceId: string) => {
      if (!sessionId || !step || busy || completed || pendingNext || consequenceModal) {
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await submitAnswer(
          sessionId,
          step.id,
          choiceId,
          viewedInvestigationIds,
          redFlagSelectionIds,
        );
        setCareerHud(res.career);
        setLastInvestigationRepDelta(res.investigationReputationDelta);
        if (res.career.newAchievements.length > 0) {
          setLastAchievementToast(res.career.newAchievements.map((a) => a.title).join(" · "));
        } else if (!res.completed) {
          setLastAchievementToast(null);
        }

        setScore(res.totalScore);
        setStepIndex(res.stepIndex);
        setTotalSteps(res.totalSteps);

        if (res.consequenceBeat) {
          pendingAfterConsequenceRef.current = res;
          setConsequenceModal(res.consequenceBeat);
        } else {
          pendingAfterConsequenceRef.current = null;
          finishAnswerFlow(res);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка отправки ответа");
      } finally {
        setBusy(false);
      }
    },
    [
      sessionId,
      step,
      busy,
      completed,
      pendingNext,
      consequenceModal,
      viewedInvestigationIds,
      redFlagSelectionIds,
      finishAnswerFlow,
    ],
  );

  const choiceBlockBusy = busy || !!pendingNext || !!consequenceModal;
  const redFlagReady =
    !step?.redFlagGame || redFlagSelectionIds.length === step.redFlagGame.requiredPickCount;
  const stepActionsLocked = choiceBlockBusy || !redFlagReady;
  const fallbacks = step ? fallbackChoices(step) : [];
  if (!scenarioId) {
    return <p className="loading">Некорректный адрес.</p>;
  }

  if (error && !detail) {
    return (
      <div className="lc-theme sim-page-lc">
        <div className="error-banner">{error}</div>
        <Link to="/dashboard#tasks" className="btn btn-text">
          ← К задачам
        </Link>
      </div>
    );
  }

  return (
    <div className="lc-theme sim-page-lc">
      {detail ? (
        <nav className="lc-breadcrumb" aria-label="Навигация по задачам">
          <Link to="/dashboard#tasks">Задачи</Link>
          <span className="lc-breadcrumb-sep" aria-hidden>
            /
          </span>
          <span className="lc-breadcrumb-current">{detail.title}</span>
        </nav>
      ) : (
        <Link to="/dashboard#tasks" className="btn btn-text" style={{ marginBottom: 16, display: "inline-flex" }}>
          ← К задачам
        </Link>
      )}
      {error ? <div className="error-banner">{error}</div> : null}

      {consequenceModal ? (
        <div className="consequence-overlay" role="dialog" aria-modal="true" aria-labelledby="consequence-title">
          <div className="consequence-dialog">
            <h2 id="consequence-title">Последствия</h2>
            <p className="consequence-text">{consequenceModal}</p>
            <button type="button" className="btn btn-primary" onClick={onConsequenceAck}>
              Далее к разбору
            </button>
          </div>
        </div>
      ) : null}

      {careerHud ? (
        <div className="sim-career-hud" aria-live="polite">
          <span>
            <strong>{careerTitle(careerHud.role)}</strong>
          </span>
          <span className="sim-career-rep">
            Доверие: <strong>{careerHud.reputation}%</strong>
            {careerHud.reputationDelta !== 0 ? (
              <span className={careerHud.reputationDelta > 0 ? "delta-up" : "delta-down"}>
                {" "}
                ({careerHud.reputationDelta > 0 ? "+" : ""}
                {careerHud.reputationDelta})
              </span>
            ) : null}
          </span>
          {lastInvestigationRepDelta != null && lastInvestigationRepDelta !== 0 ? (
            <span className="inv-rep-hint" title="Вклад осмотра в этом ответе">
              Осмотр: {lastInvestigationRepDelta > 0 ? "+" : ""}
              {lastInvestigationRepDelta}
            </span>
          ) : null}
          <span>
            Идеально подряд: <strong>{careerHud.perfectScenarioStreak}</strong>
          </span>
          {careerHud.roleChanged ? <span className="role-up-badge">Новая роль!</span> : null}
        </div>
      ) : null}

      {lastAchievementToast ? (
        <div className="achievement-toast" role="status">
          <strong>Достижение:</strong> {lastAchievementToast}
        </div>
      ) : null}

      {!detail || !sessionId || (!completed && !step) ? (
        <div className="skeleton" aria-busy />
      ) : null}

      {detail && sessionId ? (
        <div className="sim-panel sim-panel--lc">
          <div className="sim-header">
            <div className="lc-problem-title-row">
              <h1 className="lc-problem-title">{detail.title}</h1>
              <div className="lc-problem-meta">
                <span
                  className={`lc-diff ${detail.type === "EMAIL" ? "lc-diff--email" : "lc-diff--social"}`}
                >
                  {scenarioTypeLabel(detail.type)}
                </span>
                <span className="score-pill" aria-live="polite">
                  Баллы: {score}
                </span>
              </div>
            </div>
          </div>

          {completed ? (
            <div className="completed-box">
              <h2 id="complete-title">Сценарий завершён</h2>
              {feedback ? (
                <div
                  className={`feedback ${feedback.ok ? "ok" : "bad"}`}
                  style={{ textAlign: "left", maxWidth: 560, margin: "0 auto 20px" }}
                >
                  <strong>Разбор: </strong>
                  {feedback.text}
                </div>
              ) : null}
              <p aria-labelledby="complete-title">
                Вы набрали <strong>{score}</strong> баллов. Доверие клиентов:{" "}
                <strong>{careerHud?.reputation ?? "—"}%</strong>.
              </p>
              <Link to="/dashboard#tasks" className="btn btn-primary">
                К списку задач
              </Link>
            </div>
          ) : step ? (
            <div className="sim-body">
              <MissionWindow bodyClassName="mission-window-body--lc">
                <div className="mission-lc">
                    <aside className="mission-lc-desc" aria-label="Условие задания">
                      <div className="mission-lc-tabs" role="tablist" aria-label="Разделы задания">
                        <div className="mission-lc-tabs-main">
                          <span className="mission-lc-tab mission-lc-tab--active" role="tab" aria-selected={true}>
                            Условие
                          </span>
                          <span className="mission-lc-tab mission-lc-tab--muted" aria-hidden>
                            Разбор
                          </span>
                        </div>
                        <span className="mission-lc-step-badge">
                          Шаг {stepIndex + 1} / {totalSteps}
                        </span>
                      </div>
                      <div className="mission-lc-scroll">
                        <section className="mission-lc-block">
                          <h2 className="mission-lc-h2">Ситуация</h2>
                          <p className="mission-lc-text">{missionBriefText(step)}</p>
                        </section>
                        {step.narrative.trim().length > 0 ? (
                          <section className="mission-lc-block">
                            <h3 className="mission-lc-h3">Материал для анализа</h3>
                            <div className="mission-lc-narrative">{step.narrative}</div>
                          </section>
                        ) : null}

                        {step.pressureSeconds != null && step.pressureSeconds > 0 ? (
                          <PressureTimer
                            totalSeconds={step.pressureSeconds}
                            stepId={step.id}
                            frozen={choiceBlockBusy}
                          />
                        ) : null}

                        <InvestigationDock
                          step={step}
                          disabled={choiceBlockBusy}
                          viewedIds={viewedInvestigationIds}
                          onViewPanel={markPanelViewed}
                        />

                        {step.redFlagGame ? (
                          <RedFlagPicker
                            game={step.redFlagGame}
                            selectedIds={redFlagSelectionIds}
                            onChange={setRedFlagSelectionIds}
                            disabled={choiceBlockBusy}
                          />
                        ) : null}
                      </div>
                    </aside>

                    <div
                      className="mission-lc-workspace mission-lc-workspace--fullbleed"
                      aria-label={`Симуляция: ${missionWindowLabel(step)}`}
                    >
                      <div className="mission-app-viewport mission-app-viewport--lc">
                        <StepSimulation
                          step={step}
                          disabled={stepActionsLocked}
                          onChoose={onChoose}
                          genericChoices={step.choices}
                          splitLayout
                          childrenFooter={
                            fallbacks.length > 0 ? (
                              <div
                                className="choice-list choice-list-fallback"
                                role="group"
                                aria-label="Дополнительные действия"
                              >
                                {fallbacks.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    className="choice-btn"
                                    disabled={stepActionsLocked}
                                    onClick={() => onChoose(c.id)}
                                  >
                                    {c.label}
                                  </button>
                                ))}
                              </div>
                            ) : null
                          }
                        />
                      </div>
                    </div>
                  </div>
              </MissionWindow>

              {feedback ? (
                <div className={`feedback ${feedback.ok ? "ok" : "bad"}`} role="status">
                  <strong>Разбор: </strong>
                  {feedback.text}
                  {pendingNext ? (
                    <div style={{ marginTop: 16 }}>
                      <button type="button" className="btn btn-primary" onClick={onContinue}>
                        Далее
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
