import type { ReactNode } from "react";
import { useMemo } from "react";
import { stepAnalysisText } from "../../missionText";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

export function ExtensionStoreSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, childrenFooter, splitLayout = false } = props;
  const analysisText = stepAnalysisText(step);
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const name = step.simExtensionName?.trim() || "Расширение";
  const publisher = step.simExtensionPublisher?.trim() || "Неизвестный издатель";
  const blurb = step.simExtensionBlurb?.trim() || "";
  const orphan = useMemo(() => step.hotspots, [step.hotspots]);

  return (
    <div className="ui-frame ui-frame-extension sim-ext-root">
      <header className="sim-ext-topbar sim-app-bar" aria-label="Магазин расширений">
        <span className="sim-ext-store-badge">Chrome Web Store</span>
        <span className="sim-ext-search-fake" aria-hidden>
          Поиск расширений…
        </span>
      </header>
      <div className="sim-ext-body">
        <div className="sim-ext-card">
          <div className="sim-ext-card-head">
            <div className="sim-ext-icon" aria-hidden>
              ✉
            </div>
            <div>
              <h2 className="sim-ext-name">{name}</h2>
              <p className="sim-ext-publisher">{publisher}</p>
              <p className="sim-ext-stars" aria-hidden>
                ★★★★☆ <span className="sim-ext-rating-meta">4.3 · 12 400 пользователей</span>
              </p>
            </div>
          </div>
          {blurb ? <p className="sim-ext-blurb">{blurb}</p> : null}
          <div className="sim-ext-permissions">
            <span className="sim-ext-label">Подробности</span>
            {splitLayout ? (
              <p className="sim-split-hint sim-ext-split-hint">Список разрешений — в разделе «Условие» (кнопка «К условию» вверху).</p>
            ) : (
              <div className="sim-ext-permissions-body">{analysisText}</div>
            )}
          </div>
          {noise ? <div className="sim-ext-noise">{noise}</div> : null}
        </div>
        <OrphanHotspotRow hotspots={orphan} disabled={disabled} onChoose={onChoose} />
      </div>
      {childrenFooter}
    </div>
  );
}
