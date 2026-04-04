import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { splitChatSegments } from "../../chatSimulationHelpers";
import { stepAnalysisText } from "../../missionText";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";
import { hotspotByVariant } from "./hotspotHelpers";

type AnimState =
  | { kind: "split" }
  | { kind: "live"; lines: string[]; typing: boolean; done: boolean };

export function ChatMessengerSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, childrenFooter, splitLayout = false } = props;
  const analysisText = stepAnalysisText(step);
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const chatTitle = step.simChatTitle?.trim() || "Чат";
  const forwardFrom = step.simChatForwardFrom?.trim();
  const sender = step.simChatSenderLabel?.trim() || "Контакт";
  const linkHs = useMemo(() => hotspotByVariant(step, "LINK"), [step]);
  const orphan = useMemo(
    () => step.hotspots.filter((h) => h.variant.toUpperCase() !== "LINK"),
    [step.hotspots],
  );

  const [miniToast, setMiniToast] = useState<string | null>(null);
  const [anim, setAnim] = useState<AnimState>(() =>
    splitLayout ? { kind: "split" } : { kind: "live", lines: [], typing: true, done: false },
  );

  const statusSubtitle =
    splitLayout || (anim.kind === "live" && !anim.typing) ? "онлайн" : "печатает…";

  const timerIdsRef = useRef<number[]>([]);

  useEffect(() => setMiniToast(null), [step.id]);
  useEffect(() => {
    if (!miniToast) {
      return;
    }
    const t = window.setTimeout(() => setMiniToast(null), 2200);
    return () => clearTimeout(t);
  }, [miniToast]);

  useEffect(() => {
    if (splitLayout) {
      setAnim({ kind: "split" });
      return;
    }
    const segments = splitChatSegments(analysisText);
    timerIdsRef.current.forEach(clearTimeout);
    timerIdsRef.current = [];
    let cancelled = false;
    const pushTimer = (id: number) => {
      timerIdsRef.current.push(id);
    };

    if (segments.length === 0) {
      setAnim({ kind: "live", lines: [], typing: false, done: true });
      return;
    }

    setAnim({ kind: "live", lines: [], typing: true, done: false });

    const runSegment = (index: number, acc: string[]) => {
      if (cancelled) {
        return;
      }
      if (index >= segments.length) {
        setAnim({ kind: "live", lines: acc, typing: false, done: true });
        return;
      }
      const piece = segments[index];
      if (piece == null) {
        setAnim({ kind: "live", lines: acc, typing: false, done: true });
        return;
      }
      setAnim({ kind: "live", lines: acc, typing: true, done: false });
      const delayTyping = 480 + Math.floor(Math.random() * 380);
      const t1 = window.setTimeout(() => {
        if (cancelled) {
          return;
        }
        const nextLines = [...acc, piece];
        setAnim({ kind: "live", lines: nextLines, typing: false, done: false });
        const t2 = window.setTimeout(() => runSegment(index + 1, nextLines), 220 + Math.floor(Math.random() * 120));
        pushTimer(t2);
      }, delayTyping);
      pushTimer(t1);
    };

    runSegment(0, []);

    return () => {
      cancelled = true;
      timerIdsRef.current.forEach(clearTimeout);
      timerIdsRef.current = [];
    };
  }, [step.id, analysisText, splitLayout]);

  const showActions = splitLayout || (anim.kind === "live" && anim.done);

  return (
    <div className="ui-frame ui-frame-chat sim-chat-root">
      {miniToast ? <div className="sim-mini-toast">{miniToast}</div> : null}
      <header className="sim-chat-topbar sim-app-bar" aria-label="Мессенджер">
        <div className="sim-chat-topbar-inner">
          <span className="sim-chat-back" aria-hidden>
            ‹
          </span>
          <div className="sim-chat-topbar-meta">
            <span className="sim-chat-title">{chatTitle}</span>
            <span className="sim-chat-subtitle">{statusSubtitle}</span>
          </div>
          <button
            type="button"
            className="app-nav-pill app-nav-pill--icon"
            title="Меню чата"
            onClick={() => setMiniToast("Меню в этом интерфейсе не настроено")}
          >
            ⋮
          </button>
        </div>
      </header>
      <div className="sim-chat-body">
        {noise ? <div className="sim-chat-noise-wrap">{noise}</div> : null}
        {forwardFrom ? (
          <div className="sim-chat-forward-banner" role="note">
            <span className="sim-chat-forward-label">Переслано из</span>
            <span className="sim-chat-forward-from">{forwardFrom}</span>
          </div>
        ) : null}
        <div className="sim-chat-thread" aria-live="polite">
          {splitLayout ? (
            <div className="sim-chat-bubble-wrap">
              <div className="sim-chat-bubble-meta">{sender}</div>
              <div className="sim-chat-bubble sim-chat-bubble--in">
                <p className="sim-split-hint sim-chat-split-hint">
                  Текст сообщения — в разделе «Условие» (кнопка «К условию» вверху).
                </p>
                {linkHs ? (
                  <button
                    type="button"
                    className="sim-chat-inline-link"
                    disabled={disabled}
                    onClick={() => onChoose(linkHs.choiceId)}
                  >
                    {linkHs.label}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              {anim.kind === "live" &&
                anim.lines.map((line, i) => (
                  <div key={`${step.id}-msg-${i}`} className="sim-chat-bubble-wrap sim-chat-bubble-wrap--stagger">
                    <div className="sim-chat-bubble-meta">
                      {sender}
                      <span className="sim-chat-msg-time" aria-hidden>
                        {formatFakeTime(i)}
                      </span>
                    </div>
                    <div className="sim-chat-bubble sim-chat-bubble--in">
                      <div className="sim-chat-bubble-text">{line}</div>
                    </div>
                  </div>
                ))}
              {anim.kind === "live" && anim.typing ? (
                <div className="sim-chat-bubble-wrap sim-chat-typing-wrap" aria-label="Собеседник печатает">
                  <div className="sim-chat-bubble-meta">{sender}</div>
                  <div className="sim-chat-typing-bubble" aria-hidden>
                    <span className="sim-chat-typing-dot" />
                    <span className="sim-chat-typing-dot" />
                    <span className="sim-chat-typing-dot" />
                  </div>
                </div>
              ) : null}
              {anim.kind === "live" && anim.done && linkHs ? (
                <div className="sim-chat-bubble-wrap">
                  <div className="sim-chat-bubble-meta">{sender}</div>
                  <div className="sim-chat-bubble sim-chat-bubble--in">
                    <button
                      type="button"
                      className="sim-chat-inline-link"
                      disabled={disabled}
                      onClick={() => onChoose(linkHs.choiceId)}
                    >
                      {linkHs.label}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
        {showActions ? <OrphanHotspotRow hotspots={orphan} disabled={disabled} onChoose={onChoose} /> : null}
      </div>
      {childrenFooter}
    </div>
  );
}

function formatFakeTime(index: number): string {
  const base = 21 * 60 + 2;
  const m = base + index;
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
