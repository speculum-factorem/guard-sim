import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

export function VirusTotalSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
}) {
  const { step, disabled, onChoose, childrenFooter } = props;
  const g = step.virusTotalGame;
  if (!g) {
    return null;
  }
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const [phase, setPhase] = useState<"scan" | "done">("scan");

  useEffect(() => {
    setPhase("scan");
    const t = window.setTimeout(() => setPhase("done"), 900);
    return () => clearTimeout(t);
  }, [step.id]);

  const clean = g.enginesFlagged === 0;
  const ratio = `${g.enginesFlagged} / ${g.enginesTotal}`;

  return (
    <div className="ui-frame ui-frame-vt-lookup sim-vt-root">
      <header className="sim-vt-head">
        <span className="sim-vt-logo" aria-hidden>
          VT
        </span>
        <div className="sim-vt-head-text">
          <span className="sim-vt-title">VirusTotal · учебный снимок</span>
          <span className="sim-vt-sub">Запрос к URL не уходит в интернет</span>
        </div>
      </header>
      <div className="sim-vt-body">
        <div className="sim-vt-url-block">
          <span className="sim-vt-label">Проверяемый URL</span>
          <code className="sim-vt-url">{g.scannedUrl}</code>
          <span className="sim-vt-permalink">{g.permalinkStub}</span>
        </div>
        {phase === "scan" ? (
          <div className="sim-vt-scanning" role="status">
            <span className="sim-vt-spinner" aria-hidden />
            Запрашиваем сводку движков…
          </div>
        ) : (
          <div className={`sim-vt-verdict${clean ? " sim-vt-verdict--clean" : " sim-vt-verdict--bad"}`}>
            <div className="sim-vt-ring" aria-hidden>
              <span className="sim-vt-ring-num">{ratio}</span>
              <span className="sim-vt-ring-cap">детектов</span>
            </div>
            <p className="sim-vt-verdict-text">{g.verdictHeadline}</p>
          </div>
        )}
        {noise}
        <p className="sim-vt-footnote" role="note">
          В жизни сверяйте дату отчёта и не полагайтесь только на один сервис. Политика компании решает, можно ли
          покупать VPN по такой ссылке.
        </p>
        {phase === "done" ? (
          <>
            <OrphanHotspotRow hotspots={step.hotspots} disabled={disabled} onChoose={onChoose} />
            {childrenFooter}
          </>
        ) : (
          <p className="sim-vt-wait-actions">Дождитесь окончания проверки, затем выберите действие.</p>
        )}
      </div>
    </div>
  );
}
