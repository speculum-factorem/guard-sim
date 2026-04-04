import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { stepAnalysisText } from "../../missionText";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";
import { hotspotByVariant } from "./hotspotHelpers";

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
  useEffect(() => setMiniToast(null), [step.id]);
  useEffect(() => {
    if (!miniToast) {
      return;
    }
    const t = window.setTimeout(() => setMiniToast(null), 2200);
    return () => clearTimeout(t);
  }, [miniToast]);

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
            <span className="sim-chat-subtitle">онлайн</span>
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
        <div className="sim-chat-bubble-wrap">
          <div className="sim-chat-bubble-meta">{sender}</div>
          <div className="sim-chat-bubble sim-chat-bubble--in">
            {splitLayout ? (
              <p className="sim-split-hint sim-chat-split-hint">Текст сообщения — в разделе «Условие» (кнопка «К условию» вверху).</p>
            ) : (
              <div className="sim-chat-bubble-text">{analysisText}</div>
            )}
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
        <OrphanHotspotRow hotspots={orphan} disabled={disabled} onChoose={onChoose} />
      </div>
      {childrenFooter}
    </div>
  );
}
