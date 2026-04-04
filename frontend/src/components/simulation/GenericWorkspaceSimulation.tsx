import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { SITE_NAME } from "../../siteMeta";
import { stepAnalysisText } from "../../missionText";
import type { ChoicePublic, StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";
import { mockGenericAttachments } from "./simMockData";

export function GenericWorkspaceSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  /** Варианты ответа, если нет хотспотов (обычно все варианты шага) */
  choiceButtons: ChoicePublic[];
  childrenFooter?: ReactNode;
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, choiceButtons, childrenFooter, splitLayout = false } = props;
  const analysisText = stepAnalysisText(step);
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const useHotspots = step.hotspots.length > 0;

  const [helpOpen, setHelpOpen] = useState(false);
  const [fontScale, setFontScale] = useState<0 | 1 | 2>(1);
  const [fileHint, setFileHint] = useState<string | null>(null);

  const mockFiles = useMemo(() => mockGenericAttachments(step.id), [step.id]);

  useEffect(() => {
    setHelpOpen(false);
    setFontScale(1);
    setFileHint(null);
  }, [step.id]);

  useEffect(() => {
    if (!fileHint) {
      return;
    }
    const t = window.setTimeout(() => setFileHint(null), 2200);
    return () => clearTimeout(t);
  }, [fileHint]);

  const fontClass =
    fontScale === 0 ? "sim-generic-body--font-sm" : fontScale === 2 ? "sim-generic-body--font-lg" : "";

  return (
    <div className="ui-frame sim-generic-workspace">
      {fileHint ? <div className="sim-mini-toast">{fileHint}</div> : null}
      <div className="sim-generic-chrome sim-app-bar">
        <div className="sim-generic-chrome-left">
          <span className="sim-generic-title">Задание</span>
          <span className="sim-generic-badge">{SITE_NAME}</span>
        </div>
        <div className="sim-generic-chrome-actions">
          <button type="button" className="app-nav-pill app-nav-pill--icon" title="Краткая справка" onClick={() => setHelpOpen(true)}>
            ?
          </button>
          <button
            type="button"
            className="app-nav-pill app-nav-pill--natural app-nav-pill--icon"
            title="Размер текста (локально для блока)"
            onClick={() => setFontScale((s) => ((s + 1) % 3) as 0 | 1 | 2)}
          >
            Аа
          </button>
        </div>
      </div>
      {helpOpen ? (
        <>
          <button type="button" className="sim-sim-backdrop" aria-label="Закрыть" onClick={() => setHelpOpen(false)} />
          <div className="sim-modal-panel sim-generic-help" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 10px" }}>Справка</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              Выберите вариант, который соответствует условию. Кнопки «?» и «Аа» меняют только отображение в этом окне.
            </p>
            <button type="button" className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setHelpOpen(false)}>
              Закрыть
            </button>
          </div>
        </>
      ) : null}
      <div className={`sim-generic-body ${fontClass}`.trim()}>
        <div className="sim-generic-attachments" role="group" aria-label="Вложения и ссылки">
          {mockFiles.map((f) => (
            <button
              key={f.id}
              type="button"
              className="sim-generic-attach-chip"
              onClick={() => setFileHint(`${f.label}: ${f.hint}`)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {splitLayout ? (
          <p className="sim-split-hint sim-generic-split-hint">
            Формулировка — в разделе «Условие» (кнопка «К условию» вверху).
          </p>
        ) : (
          <div className="narrative sim-generic-narrative">{analysisText}</div>
        )}
        {noise}
        {useHotspots ? (
          <OrphanHotspotRow hotspots={step.hotspots} disabled={disabled} onChoose={onChoose} />
        ) : (
          <div className="sim-generic-actions" role="group" aria-label="Варианты ответа">
            {choiceButtons.map((c) => (
              <button
                key={c.id}
                type="button"
                className="choice-btn sim-generic-choice"
                disabled={disabled}
                onClick={() => onChoose(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        {childrenFooter}
      </div>
    </div>
  );
}
