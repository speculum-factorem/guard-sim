import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

export function NetShieldSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
}) {
  const { step, disabled, onChoose, childrenFooter } = props;
  const g = step.netShieldGame;
  if (!g) {
    return null;
  }
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const hostLabel = step.emailSubject?.trim() || "perimeter-gw";
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 2600);
    return () => clearTimeout(t);
  }, [step.id]);

  return (
    <div className="ui-frame ui-frame-net-shield sim-netshield-root">
      <header className="sim-netshield-head">
        <div className="sim-netshield-traffic" aria-hidden>
          <span className="sim-netshield-dot sim-netshield-dot--r" />
          <span className="sim-netshield-dot sim-netshield-dot--y" />
          <span className="sim-netshield-dot sim-netshield-dot--g" />
        </div>
        <div className="sim-netshield-head-text">
          <span className={`sim-netshield-title${pulse ? " sim-netshield-title--pulse" : ""}`}>{g.consoleTitle}</span>
          <span className="sim-netshield-sub">узел {hostLabel}</span>
        </div>
        <span className="sim-netshield-live" aria-hidden>
          ● LIVE
        </span>
      </header>
      <div className="sim-netshield-body">
        <p className="sim-netshield-action-hint" role="status">
          Выберите одну строку и нажмите «Разорвать сессию» — действие отправится как ответ на шаг.
        </p>
        <div className="sim-netshield-table-wrap" role="region" aria-label="Таблица соединений">
          <table className="sim-netshield-table">
            <thead>
              <tr>
                <th scope="col">Удалённый IP</th>
                <th scope="col">Узел (SNI/хост)</th>
                <th scope="col">Интенсивность</th>
                <th scope="col">Заметка</th>
                <th scope="col">Действие</th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <code className="sim-netshield-ip">{row.remoteIp}</code>
                  </td>
                  <td className="sim-netshield-host">{row.remoteHost}</td>
                  <td className="sim-netshield-rate">{row.rateLabel}</td>
                  <td className="sim-netshield-note">{row.note ?? "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="sim-netshield-drop-btn"
                      disabled={disabled}
                      onClick={() => onChoose(row.choiceId)}
                    >
                      Разорвать сессию
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {noise}
        <OrphanHotspotRow hotspots={step.hotspots} disabled={disabled} onChoose={onChoose} />
        {childrenFooter}
      </div>
    </div>
  );
}
