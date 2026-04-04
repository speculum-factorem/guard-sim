import type { ReactNode } from "react";
import { useMemo } from "react";
import { stepAnalysisText } from "../../missionText";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";
import { hotspotByVariant } from "./hotspotHelpers";

export function CalendarInviteSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, childrenFooter, splitLayout = false } = props;
  const analysisText = stepAnalysisText(step);
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const title = step.emailSubject?.trim() || "Приглашение";
  const organizer = step.emailFrom?.trim() || "Организатор";
  const when = step.simCalendarWhen?.trim() || "Время не указано";
  const where = step.simCalendarWhere?.trim() || "Место не указано";
  const linkHs = useMemo(() => hotspotByVariant(step, "LINK"), [step]);
  const orphan = useMemo(
    () => step.hotspots.filter((h) => h.variant.toUpperCase() !== "LINK"),
    [step.hotspots],
  );

  return (
    <div className="ui-frame ui-frame-calendar sim-cal-root">
      <header className="sim-cal-topbar sim-app-bar" aria-label="Календарь">
        <span className="sim-cal-topbar-title">Календарь</span>
        <span className="sim-cal-topbar-date">Сегодня</span>
      </header>
      <div className="sim-cal-body">
        <article className="sim-cal-card" aria-label="Приглашение на событие">
          <h2 className="sim-cal-event-title">{title}</h2>
          <p className="sim-cal-organizer">
            <span className="sim-cal-label">Организатор</span> {organizer}
          </p>
          <div className="sim-cal-row">
            <span className="sim-cal-ico" aria-hidden>
              🕐
            </span>
            <span>{when}</span>
          </div>
          <div className="sim-cal-row">
            <span className="sim-cal-ico" aria-hidden>
              📍
            </span>
            <span>{where}</span>
          </div>
          <div className="sim-cal-desc">
            <span className="sim-cal-label">Описание</span>
            {splitLayout ? (
              <p className="sim-split-hint sim-cal-split-hint">Текст приглашения — в разделе «Условие» (кнопка «К условию» вверху).</p>
            ) : (
              <div className="sim-cal-desc-body">{analysisText}</div>
            )}
            {linkHs ? (
              <button
                type="button"
                className="sim-cal-join-btn"
                disabled={disabled}
                onClick={() => onChoose(linkHs.choiceId)}
              >
                {linkHs.label}
              </button>
            ) : null}
          </div>
          {noise ? <div className="sim-cal-noise">{noise}</div> : null}
        </article>
        <OrphanHotspotRow hotspots={orphan} disabled={disabled} onChoose={onChoose} />
      </div>
      {childrenFooter}
    </div>
  );
}
