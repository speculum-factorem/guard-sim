import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

export function PhoneIncidentSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
}) {
  const { step, disabled, onChoose, childrenFooter } = props;
  const g = step.phoneIncidentGame;
  if (!g) {
    return null;
  }
  const c = g.callOverlay;
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 3200);
    return () => clearTimeout(t);
  }, [step.id]);

  return (
    <div className="ui-frame ui-frame-phone-incident sim-phone-root">
      <div className="sim-phone-device" aria-label="Учебная имитация смартфона">
        <div className="sim-phone-bezel">
          <div className="sim-phone-notch" aria-hidden />
          <div className="sim-phone-screen">
            <header className="sim-phone-status" aria-hidden>
              <span className="sim-phone-time">{g.statusBarTime}</span>
              <span className="sim-phone-status-icons">
                <span className="sim-phone-sig" />
                <span className="sim-phone-wifi" />
                <span className="sim-phone-batt" />
              </span>
            </header>
            <div className="sim-phone-net-banner">{g.networkLabel}</div>
            <div className="sim-phone-msgs-head">
              <span className="sim-phone-msgs-title">{g.screenTitle}</span>
              <span className="sim-phone-msgs-edit">Изменить</span>
            </div>
            <div className="sim-phone-sms-scroll" role="log" aria-label="Лента SMS">
              {g.smsLines.map((row, i) => (
                <div key={`${row.sender}-${i}`} className="sim-phone-sms-row">
                  <div className="sim-phone-sms-avatar" aria-hidden>
                    {row.sender.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="sim-phone-sms-main">
                    <div className="sim-phone-sms-meta">
                      <span className="sim-phone-sms-sender">{row.sender}</span>
                      <span className="sim-phone-sms-time">{row.time}</span>
                    </div>
                    <p className="sim-phone-sms-text">{row.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="sim-phone-call-layer" role="dialog" aria-modal="true" aria-label="Входящий звонок">
              <div className="sim-phone-call-backdrop" aria-hidden />
              <div className={`sim-phone-call-card${pulse ? " sim-phone-call-card--pulse" : ""}`}>
                <p className="sim-phone-call-hint">входящий вызов</p>
                <div className="sim-phone-call-avatar" aria-hidden>
                  <span>?</span>
                </div>
                <h2 className="sim-phone-call-name">{c.callerLabel}</h2>
                <p className="sim-phone-call-sub">{c.callerSubtitle}</p>
                <p className="sim-phone-call-num">{c.numberDisplay}</p>
                <p className="sim-phone-call-warn" role="note">
                  На фоне лавины SMS легко нажать «ответить». Сначала решите, как поступите — кнопки действий ниже.
                </p>
                <div className="sim-phone-call-fake-btns" aria-hidden>
                  <span className="sim-phone-decline-ico" />
                  <span className="sim-phone-answer-ico" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {noise}
      <OrphanHotspotRow hotspots={step.hotspots} disabled={disabled} onChoose={onChoose} />
      {childrenFooter}
    </div>
  );
}
