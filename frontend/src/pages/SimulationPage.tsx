import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { DASHBOARD_TASKS_HREF } from "../navigationConstants";
import { levelLabel } from "../progressLabels";
import { StepSimulation } from "../components/simulation/StepSimulation";
import { MissionSplitLayoutHint } from "../components/MissionSplitLayoutHint";
import { fetchScenario, startSession, submitAnswer } from "../api";
import { dismissMissionSplitHint, isMissionSplitHintDismissed } from "../missionLayoutHintStorage";
import { missionChannelLabel } from "../scenarioHub";
import { simulationHttpErrorMessage } from "../simulationErrorMessage";
import { missionBriefText, stepAnalysisText } from "../missionText";
import type {
  AnswerResponse,
  AttackBreakdown,
  CareerSnapshot,
  ChoicePublic,
  ScenarioDetail,
  ScenarioHubChannel,
  StepPublic,
} from "../types";

function missionDiffClass(hub: ScenarioHubChannel): string {
  switch (hub) {
    case "SECURITY":
      return "lc-diff--security";
    case "SOCIAL":
      return "lc-diff--social";
    default:
      return "lc-diff--email";
  }
}

function hotspotChoiceIds(step: StepPublic): Set<string> {
  return new Set(step.hotspots.map((h) => h.choiceId));
}

function serpPickChoiceIds(step: StepPublic): Set<string> {
  const g = step.serpPickGame;
  if (!g) return new Set();
  return new Set(g.results.map((r) => r.choiceId));
}

function netShieldChoiceIds(step: StepPublic): Set<string> {
  const g = step.netShieldGame;
  if (!g) return new Set();
  return new Set(g.rows.map((r) => r.choiceId));
}

function fallbackChoices(step: StepPublic): ChoicePublic[] {
  /* GENERIC без хотспотов: все ответы уже в GenericWorkspaceSimulation — не дублировать в childrenFooter */
  if (step.uiKind === "GENERIC" && step.hotspots.length === 0) {
    return [];
  }
  const fromHotspots = hotspotChoiceIds(step);
  const game = step.urlCompareGame;
  const serp = serpPickChoiceIds(step);
  const net = netShieldChoiceIds(step);
  return step.choices.filter((c) => {
    if (fromHotspots.has(c.id)) return false;
    if (game && (c.id === game.leftChoiceId || c.id === game.rightChoiceId)) return false;
    if (serp.has(c.id)) return false;
    if (net.has(c.id)) return false;
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
    case "SEARCH_ENGINE_RESULTS":
      return "Поисковая выдача";
    case "NET_SHIELD_CONSOLE":
      return "Консоль периметра";
    case "VIRUSTOTAL_LOOKUP":
      return "Проверка URL (VirusTotal)";
    case "MOBILE_PHONE_INCIDENT":
      return "Смартфон";
    case "CHAT_MESSENGER":
      return "Мессенджер";
    case "CALENDAR_INVITE":
      return "Календарь";
    case "EXTENSION_STORE":
      return "Магазин расширений";
    default:
      return "Задание";
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
  onExpired,
}: {
  totalSeconds: number | null | undefined;
  stepId: string;
  frozen: boolean;
  onExpired?: () => void;
}) {
  const [left, setLeft] = useState(totalSeconds ?? 0);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;
  const firedRef = useRef(false);

  useEffect(() => {
    setLeft(totalSeconds ?? 0);
    firedRef.current = false;
  }, [stepId, totalSeconds]);

  useEffect(() => {
    if (frozen || !totalSeconds || totalSeconds <= 0) {
      return;
    }
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 0) return 0;
        const next = s - 1;
        if (next === 0 && !firedRef.current) {
          firedRef.current = true;
          queueMicrotask(() => onExpiredRef.current?.());
        }
        return next;
      });
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
        <span className="pressure-bar-label">Время на шаг</span>
        <span className="pressure-bar-seconds" aria-live="polite">
          {left} с
        </span>
      </div>
      <div className="pressure-bar-track" aria-hidden>
        <div className="pressure-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {expired ? (
        <p className="pressure-relaxed">
          Время вышло — шаг засчитывается как ошибка, баллы за него не начисляются.
        </p>
      ) : (
        <p className="pressure-hint">Уложитесь в лимит: по нулю ответ не принимается как верный.</p>
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
  const [countedAsCompleted, setCountedAsCompleted] = useState(false);
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
  const [attackBreakdown, setAttackBreakdown] = useState<AttackBreakdown | null>(null);

  const pendingAfterConsequenceRef = useRef<AnswerResponse | null>(null);
  const pressureExpiryHandledRef = useRef(false);
  /** Увеличивается при каждом bootstrap — отбрасываем ответы устаревших запросов (Strict Mode / смена сценария). */
  const sessionLoadGenerationRef = useRef(0);
  const feedbackBannerRef = useRef<HTMLDivElement>(null);
  const continueTopRef = useRef<HTMLButtonElement>(null);
  const continueStickyRef = useRef<HTMLButtonElement>(null);
  const consequenceAckRef = useRef<HTMLButtonElement>(null);

  const [splitHintOpen, setSplitHintOpen] = useState(() => !isMissionSplitHintDismissed());
  /** Сначала экран «Условие», затем симуляция; сбрасывается на новом шаге. */
  const [missionPhase, setMissionPhase] = useState<"condition" | "simulation">("condition");
  const [sessionSyncBusy, setSessionSyncBusy] = useState(false);
  const [resumedNote, setResumedNote] = useState(false);
  const missionPhaseAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewedInvestigationIds([]);
    setLastInvestigationRepDelta(null);
    setRedFlagSelectionIds([]);
    setMissionPhase("condition");
    pressureExpiryHandledRef.current = false;
  }, [step?.id]);

  useEffect(() => {
    if (!consequenceModal) {
      return;
    }
    const id = window.setTimeout(() => consequenceAckRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [consequenceModal]);

  useEffect(() => {
    if (!feedback || !pendingNext) {
      return;
    }
    const id = window.requestAnimationFrame(() => {
      feedbackBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const mq = window.matchMedia("(max-width: 960px)");
      if (mq.matches) {
        continueStickyRef.current?.focus();
      } else {
        continueTopRef.current?.focus();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [feedback, pendingNext]);

  useEffect(() => {
    if (!feedback || pendingNext) {
      return;
    }
    const id = window.requestAnimationFrame(() => {
      feedbackBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      feedbackBannerRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [feedback, pendingNext]);

  const bootstrapSession = useCallback(
    async (opts?: { restart?: boolean }) => {
      if (!scenarioId) {
        return;
      }
      const gen = ++sessionLoadGenerationRef.current;
      setSessionSyncBusy(true);
      setError(null);
      try {
        const d = await fetchScenario(scenarioId);
        if (gen !== sessionLoadGenerationRef.current) {
          return;
        }
        setDetail(d);
        const start = await startSession(scenarioId, opts?.restart ? { restart: true } : undefined);
        if (gen !== sessionLoadGenerationRef.current) {
          return;
        }
        setSessionId(start.sessionId);
        setStep(start.currentStep);
        setStepIndex(start.stepIndex);
        setTotalSteps(start.totalSteps);
        setScore(start.totalScore ?? 0);
        setCompleted(false);
        setFeedback(null);
        setPendingNext(null);
        setCareerHud(null);
        setLastAchievementToast(null);
        setConsequenceModal(null);
        pendingAfterConsequenceRef.current = null;
        setViewedInvestigationIds([]);
        setLastInvestigationRepDelta(null);
        setRedFlagSelectionIds([]);
        setResumedNote(!!start.resumed);
        setAttackBreakdown(start.attackBreakdown ?? null);
      } catch (e) {
        if (gen !== sessionLoadGenerationRef.current) {
          return;
        }
        const sessionMsg = simulationHttpErrorMessage(e);
        setError(sessionMsg ?? (e instanceof Error ? e.message : "Ошибка загрузки"));
      } finally {
        if (gen === sessionLoadGenerationRef.current) {
          setSessionSyncBusy(false);
        }
      }
    },
    [scenarioId],
  );

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  const markPanelViewed = useCallback((id: string) => {
    setViewedInvestigationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const finishAnswerFlow = useCallback((res: AnswerResponse) => {
    setFeedback({ ok: res.correct, text: res.explanation });
    setScore(res.totalScore);
    setCompleted(res.completed);
    if (res.completed) setCountedAsCompleted(res.countedAsCompleted);
    setStepIndex(res.stepIndex);
    setTotalSteps(res.totalSteps);
    if (res.completed) {
      setPendingNext(null);
      setStep(null);
    } else if (res.nextStep) {
      setPendingNext(res.nextStep);
    }
  }, []);

  const applySubmitResponse = useCallback(
    (res: AnswerResponse) => {
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
    },
    [finishAnswerFlow],
  );

  const handlePressureTimerExpired = useCallback(() => {
    if (pressureExpiryHandledRef.current) {
      return;
    }
    if (
      !sessionId ||
      !step ||
      busy ||
      completed ||
      pendingNext ||
      consequenceModal ||
      sessionSyncBusy ||
      missionPhase !== "simulation"
    ) {
      return;
    }
    if (!step.pressureSeconds || step.pressureSeconds <= 0) {
      return;
    }
    pressureExpiryHandledRef.current = true;
    void (async () => {
      setBusy(true);
      setError(null);
      setResumedNote(false);
      try {
        const res = await submitAnswer(
          sessionId,
          step.id,
          "",
          viewedInvestigationIds,
          redFlagSelectionIds,
          { pressureExpired: true },
        );
        applySubmitResponse(res);
      } catch (e) {
        pressureExpiryHandledRef.current = false;
        const sessionMsg = simulationHttpErrorMessage(e);
        setError(sessionMsg ?? (e instanceof Error ? e.message : "Ошибка отправки ответа"));
      } finally {
        setBusy(false);
      }
    })();
  }, [
    sessionId,
    step,
    busy,
    completed,
    pendingNext,
    consequenceModal,
    sessionSyncBusy,
    missionPhase,
    viewedInvestigationIds,
    redFlagSelectionIds,
    applySubmitResponse,
  ]);

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
      setResumedNote(false);
      try {
        const res = await submitAnswer(
          sessionId,
          step.id,
          choiceId,
          viewedInvestigationIds,
          redFlagSelectionIds,
        );
        applySubmitResponse(res);
      } catch (e) {
        const sessionMsg = simulationHttpErrorMessage(e);
        setError(sessionMsg ?? (e instanceof Error ? e.message : "Ошибка отправки ответа"));
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
      applySubmitResponse,
    ],
  );

  const choiceBlockBusy = busy || !!pendingNext || !!consequenceModal || sessionSyncBusy;
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
        <Link to={DASHBOARD_TASKS_HREF} className="btn btn-text">
          ← К задачам
        </Link>
      </div>
    );
  }

  return (
    <div className="lc-theme sim-page-lc">
      {detail ? (
        <nav className="lc-breadcrumb lc-breadcrumb--with-actions" aria-label="Навигация по задачам">
          <span className="lc-breadcrumb-row">
            <Link to={DASHBOARD_TASKS_HREF}>Задачи</Link>
            <span className="lc-breadcrumb-sep" aria-hidden>
              /
            </span>
            <span className="lc-breadcrumb-current" title={detail.title}>
              {detail.title}
            </span>
            {step && !completed ? (
              <>
                <span className="lc-breadcrumb-sep" aria-hidden>
                  /
                </span>
                <span className="lc-breadcrumb-step">
                  Шаг {stepIndex + 1} из {totalSteps}
                </span>
              </>
            ) : null}
          </span>
          {sessionId && !completed ? (
            <button
              type="button"
              className="btn btn-text sim-restart-scenario"
              disabled={sessionSyncBusy || busy}
              onClick={() => bootstrapSession({ restart: true })}
            >
              Начать сначала
            </button>
          ) : null}
        </nav>
      ) : (
        <Link to={DASHBOARD_TASKS_HREF} className="btn btn-text sim-back-to-tasks" style={{ marginBottom: 16, display: "inline-flex" }}>
          ← К задачам
        </Link>
      )}
      {error ? <div className="error-banner">{error}</div> : null}
      {resumedNote && !completed ? (
        <p className="sim-resumed-banner" role="status">
          Продолжена сохранённая попытка — шаг и баллы восстановлены.
        </p>
      ) : null}

      {consequenceModal ? (
        <div className="consequence-overlay" role="dialog" aria-modal="true" aria-labelledby="consequence-title">
          <div className="consequence-dialog">
            <h2 id="consequence-title">Последствия</h2>
            <p className="consequence-text">{consequenceModal}</p>
            <button ref={consequenceAckRef} type="button" className="btn btn-primary" onClick={onConsequenceAck}>
              Далее к разбору
            </button>
          </div>
        </div>
      ) : null}

      {careerHud ? (
        <div className="sim-career-hud" aria-live="polite">
          <span>
            <strong>{levelLabel(careerHud.level)}</strong>
          </span>
          <span className="sim-career-rep">
            Опыт: <strong>{careerHud.experience} XP</strong>
            {careerHud.experienceDelta !== 0 ? (
              <span className={careerHud.experienceDelta > 0 ? "delta-up" : "delta-down"}>
                {" "}
                ({careerHud.experienceDelta > 0 ? "+" : ""}
                {careerHud.experienceDelta})
              </span>
            ) : null}
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
          {careerHud.levelChanged ? <span className="role-up-badge">Новый уровень!</span> : null}
        </div>
      ) : null}

      {lastAchievementToast ? (
        <div className="achievement-toast" role="status">
          <strong>Достижение:</strong> {lastAchievementToast}
        </div>
      ) : null}

      {!detail || !sessionId || (!completed && !step) ? (
        <div className="sim-loading-panel sim-loading-panel--message" aria-busy="true" aria-live="polite">
          <p className="sim-loading-message">Загружаем задание…</p>
        </div>
      ) : null}

      {detail && sessionId ? (
        <div className="sim-panel sim-panel--lc">
          <div className="sim-header">
            <div className="lc-problem-title-row">
              <h1 className="lc-problem-title">{detail.title}</h1>
              <div className="lc-problem-meta">
                <span className="lc-attack-type-badge" title="Тип кибератаки">
                  {detail.attackTypeLabel}
                </span>
                <span className={`lc-diff ${missionDiffClass(detail.hubChannel ?? "MAIL")}`}>
                  {missionChannelLabel(detail.hubChannel ?? "MAIL")}
                </span>
                <span className="score-pill" aria-live="polite">
                  Баллы: {score}
                </span>
              </div>
            </div>
          </div>

          {completed ? (
            <div className={`completed-box${countedAsCompleted ? " completed-box--success" : " completed-box--failed"}`}>
              {countedAsCompleted ? (
                <>
                  <div className="completed-box-icon" aria-hidden>✓</div>
                  <h2 id="complete-title">Задание выполнено!</h2>
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
                    Вы набрали <strong>{score}</strong> баллов.{" "}
                    Опыт: <strong>+{careerHud?.experienceDelta ?? 0} XP</strong>.{" "}
                    Доверие: <strong>{careerHud?.reputation ?? "—"}%</strong>.
                  </p>
                </>
              ) : (
                <>
                  <div className="completed-box-icon completed-box-icon--fail" aria-hidden>✗</div>
                  <h2 id="complete-title" className="completed-box-title--fail">Задание не засчитано</h2>
                  {feedback ? (
                    <div
                      className="feedback bad"
                      style={{ textAlign: "left", maxWidth: 560, margin: "0 auto 20px" }}
                    >
                      <strong>Разбор: </strong>
                      {feedback.text}
                    </div>
                  ) : null}
                  <p className="completed-box-fail-hint">
                    В этой попытке были ошибки — задание не записано как выполненное и опыт не начислен.
                    Пройдите заново без ошибок, чтобы получить зачёт и <strong>+45 XP</strong>.
                  </p>
                </>
              )}
              {attackBreakdown ? (
                <div className="attack-breakdown">
                  <h3 className="attack-breakdown-title">
                    <span className="attack-breakdown-mitre-badge">MITRE ATT&amp;CK</span>
                    Разбор атаки
                  </h3>
                  <p className="attack-breakdown-summary">{attackBreakdown.summary}</p>
                  <div className="attack-breakdown-techniques">
                    {attackBreakdown.techniques.map((t) => (
                      <div key={t.techniqueId} className="attack-technique-card">
                        <div className="attack-technique-header">
                          <span className="attack-technique-id">{t.techniqueId}</span>
                          <span className="attack-technique-name">{t.techniqueName}</span>
                          <span className="attack-technique-tactic">{t.tactic}</span>
                        </div>
                        <p className="attack-technique-desc">{t.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="attack-breakdown-defend">
                    <span className="attack-breakdown-defend-label">Как защититься:</span>
                    <p className="attack-breakdown-defend-text">{attackBreakdown.howToDefend}</p>
                  </div>
                </div>
              ) : null}

              <div className="completed-box-actions">
                {!countedAsCompleted ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => bootstrapSession({ restart: true })}
                  >
                    Попробовать снова
                  </button>
                ) : null}
                <Link to={DASHBOARD_TASKS_HREF} className={countedAsCompleted ? "btn btn-primary" : "btn btn-text"}>
                  К списку задач
                </Link>
              </div>
            </div>
          ) : step ? (
            <div className="sim-body" ref={missionPhaseAnchorRef}>
              <MissionWindow bodyClassName="mission-window-body--lc">
                <div className="mission-lc mission-lc--phased">
                {missionPhase === "condition" ? (
                  <div className="mission-phase mission-phase--condition" aria-label="Экран условия">
                    <div className="mission-condition-shell">
                      <div className="mission-lc-head sim-app-bar" aria-label="Заголовок задания">
                        <span className="mission-lc-head-title">Условие</span>
                        <span className="mission-lc-step-badge">
                          Шаг {stepIndex + 1} / {totalSteps}
                        </span>
                      </div>
                      {splitHintOpen && stepIndex === 0 && !feedback && !consequenceModal ? (
                        <MissionSplitLayoutHint
                          onDismiss={() => {
                            dismissMissionSplitHint();
                            setSplitHintOpen(false);
                          }}
                        />
                      ) : null}
                      <p className="mission-lc-scroll-hint mission-lc-scroll-hint--condition">
                        <span className="mission-lc-scroll-hint-ico" aria-hidden>
                          ↕
                        </span>
                        Прокрутите, чтобы прочитать весь текст
                      </p>
                      <div className="mission-lc-scroll mission-condition-scroll">
                        <section className="mission-lc-block">
                          <h2 className="mission-lc-h2">Ситуация</h2>
                          <p className="mission-lc-text">{missionBriefText(step)}</p>
                        </section>
                        <section className="mission-lc-block">
                          <h3 className="mission-lc-h3">Материал для анализа</h3>
                          <div className="mission-lc-narrative">{stepAnalysisText(step)}</div>
                        </section>
                      </div>
                      <div className="mission-condition-cta">
                        <button
                          type="button"
                          className="btn btn-primary mission-go-sim-btn"
                          onClick={() => {
                            setMissionPhase("simulation");
                            window.requestAnimationFrame(() => {
                              missionPhaseAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            });
                          }}
                        >
                          Перейти к симуляции
                        </button>
                        <p className="mission-condition-cta-hint">После перехода откроется интерфейс задания</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mission-phase mission-phase--simulation" aria-label="Экран симуляции">
                    <div className="mission-sim-shell">
                      <header className="mission-sim-toolbar sim-app-bar">
                        <button
                          type="button"
                          className="btn btn-secondary mission-back-to-condition"
                          onClick={() => {
                            setMissionPhase("condition");
                            window.requestAnimationFrame(() => {
                              missionPhaseAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            });
                          }}
                        >
                          ← К условию
                        </button>
                        <div className="mission-sim-toolbar-meta">
                          <span className="mission-sim-toolbar-step">
                            Шаг {stepIndex + 1} / {totalSteps}
                          </span>
                          <span className="mission-sim-toolbar-kind">{missionWindowLabel(step)}</span>
                        </div>
                      </header>
                      <div className="mission-sim-stack">
                        {step.pressureSeconds != null && step.pressureSeconds > 0 ? (
                          <div className="mission-sim-block mission-sim-block--pad">
                            <PressureTimer
                              totalSeconds={step.pressureSeconds}
                              stepId={step.id}
                              frozen={choiceBlockBusy}
                              onExpired={handlePressureTimerExpired}
                            />
                          </div>
                        ) : null}
                        <div className="mission-sim-block mission-sim-block--pad">
                          <InvestigationDock
                            step={step}
                            disabled={choiceBlockBusy}
                            viewedIds={viewedInvestigationIds}
                            onViewPanel={markPanelViewed}
                          />
                        </div>
                        {step.redFlagGame ? (
                          <div className="mission-sim-block mission-sim-block--pad">
                            <RedFlagPicker
                              game={step.redFlagGame}
                              selectedIds={redFlagSelectionIds}
                              onChange={setRedFlagSelectionIds}
                              disabled={choiceBlockBusy}
                            />
                          </div>
                        ) : null}
                        <div
                          className="mission-lc-workspace mission-lc-workspace--fullbleed mission-sim-workspace"
                          aria-label={`Симуляция: ${missionWindowLabel(step)}`}
                        >
                          <div className="mission-app-viewport mission-app-viewport--lc">
                            <StepSimulation
                              step={step}
                              disabled={stepActionsLocked}
                              onChoose={onChoose}
                              genericChoices={step.choices}
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
                    </div>
                  </div>
                )}
                </div>
              </MissionWindow>

              {feedback ? (
                <div
                  ref={feedbackBannerRef}
                  tabIndex={-1}
                  className={`feedback sim-feedback-banner ${feedback.ok ? "ok" : "bad"}`}
                  role="status"
                >
                  <p className="sim-feedback-text">
                    <strong>Разбор: </strong>
                    {feedback.text}
                  </p>
                  {pendingNext ? (
                    <>
                      <div className="sim-feedback-continue sim-feedback-continue--desktop">
                        <button
                          ref={continueTopRef}
                          type="button"
                          className="btn btn-primary"
                          onClick={onContinue}
                        >
                          Далее
                        </button>
                      </div>
                      {feedback.text.length > 180 ? (
                        <div className="sim-feedback-continue sim-feedback-continue--long-desktop">
                          <button type="button" className="btn btn-primary" onClick={onContinue}>
                            Далее
                          </button>
                        </div>
                      ) : null}
                      <div className="sim-feedback-continue sim-feedback-continue--mobile-bar">
                        <button
                          ref={continueStickyRef}
                          type="button"
                          className="btn btn-primary sim-feedback-mobile-cta"
                          onClick={onContinue}
                        >
                          Далее
                        </button>
                      </div>
                    </>
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
