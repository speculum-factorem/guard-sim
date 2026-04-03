import type { ReactNode } from "react";
import type { Hotspot, StepPublic } from "../../types";
import { hotspotByVariant } from "./hotspotHelpers";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

function collectTicketHandled(step: StepPublic, actionHotspots: Hotspot[]): Set<string> {
  const handled = new Set<string>();
  const push = (h: Hotspot | undefined) => {
    if (h) {
      handled.add(h.id);
    }
  };
  push(hotspotByVariant(step, "ATTACHMENT"));
  push(hotspotByVariant(step, "REPLY"));
  actionHotspots.forEach((h) => handled.add(h.id));
  return handled;
}

export function TicketSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
}) {
  const { step, disabled, onChoose, childrenFooter } = props;
  const subject = step.emailSubject ?? "Без темы";
  const from = step.emailFrom ?? "—";
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;

  const attachHs = hotspotByVariant(step, "ATTACHMENT");
  const replyHs = hotspotByVariant(step, "REPLY");
  const actionHotspots = step.hotspots.filter((h) => h.variant.toUpperCase() === "ACTION");

  const handled = collectTicketHandled(step, actionHotspots);
  const orphan = step.hotspots.filter((h) => !handled.has(h.id));

  return (
    <div className="ui-frame ui-frame-ticket sim-ticket-layout">
      <div className="sim-ticket-grid">
        <aside className="sim-ticket-aside">
          <div className="sim-ticket-aside-label">Тикет</div>
          <div className="sim-ticket-id">INC-{step.id.slice(-4).toUpperCase()}</div>
          <div className="sim-ticket-aside-meta">ИБ · мониторинг</div>
        </aside>
        <div className="sim-ticket-main">
          <div className="ticket-header sim-ticket-header">
            <span className="ticket-priority">Приоритет</span>
            <h2 className="ticket-title">{subject}</h2>
            <p className="ticket-from">{from}</p>
          </div>
          <div className="ticket-body sim-ticket-body">
            <div className="narrative-frame">{step.narrative}</div>
            {noise}
          </div>
          <div className="sim-ticket-actions">
            {attachHs ? (
              <button
                type="button"
                className="sim-ticket-attach-btn"
                disabled={disabled}
                onClick={() => onChoose(attachHs.choiceId)}
              >
                <span aria-hidden>📎</span> {attachHs.label}
              </button>
            ) : null}
            {actionHotspots.map((h) => (
              <button
                key={h.id}
                type="button"
                className="btn btn-primary sim-ticket-primary"
                disabled={disabled}
                onClick={() => onChoose(h.choiceId)}
              >
                {h.label}
              </button>
            ))}
            {replyHs ? (
              <button
                type="button"
                className="sim-ticket-secondary"
                disabled={disabled}
                onClick={() => onChoose(replyHs.choiceId)}
              >
                {replyHs.label}
              </button>
            ) : null}
          </div>
          <OrphanHotspotRow hotspots={orphan} disabled={disabled} onChoose={onChoose} />
          {childrenFooter}
        </div>
      </div>
    </div>
  );
}
