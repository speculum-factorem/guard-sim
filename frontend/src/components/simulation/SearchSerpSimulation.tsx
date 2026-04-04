import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

export function SearchSerpSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
}) {
  const { step, disabled, onChoose, childrenFooter } = props;
  const g = step.serpPickGame;
  if (!g) {
    return null;
  }
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setToast(null);
  }, [step.id]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const onFakeSearch = useCallback(() => {
    setToast("В этом окне поиск не уходит в интернет — выберите результат из списка ниже.");
  }, []);

  return (
    <div className="ui-frame ui-frame-serp-search sim-serp-root">
      {toast ? <div className="sim-mini-toast">{toast}</div> : null}
      <div className="sim-serp-chrome" aria-hidden>
        <div className="sim-serp-dots">
          <span className="sim-serp-dot sim-serp-dot--r" />
          <span className="sim-serp-dot sim-serp-dot--y" />
          <span className="sim-serp-dot sim-serp-dot--g" />
        </div>
        <span className="sim-serp-brand">Поиск (учебный)</span>
      </div>
      <div className="sim-serp-toolbar">
        <label className="sim-serp-query-label">
          <span className="lc-visually-hidden">Запрос</span>
          <input
            className="sim-serp-query-input"
            type="search"
            readOnly
            value={g.query}
            aria-label="Строка поиска (только чтение)"
          />
        </label>
        <button type="button" className="sim-serp-search-btn" disabled={disabled} onClick={onFakeSearch}>
          Найти
        </button>
      </div>
      <div className="sim-serp-body">
        <p className="sim-serp-hint" role="note">
          Как в реальной выдаче: похожие заголовки, но домены различаются. Клик по карточке — ваш выбор.
        </p>
        {noise}
        <ul className="sim-serp-results" aria-label="Результаты поиска">
          {g.results.map((r) => (
            <li key={r.choiceId} className="sim-serp-result-li">
              <button
                type="button"
                className="sim-serp-result-card"
                disabled={disabled}
                onClick={() => onChoose(r.choiceId)}
              >
                <span className="sim-serp-result-title">{r.title}</span>
                <span className="sim-serp-result-url">{r.displayUrl}</span>
                <span className="sim-serp-result-snippet">{r.snippet}</span>
              </button>
            </li>
          ))}
        </ul>
        <OrphanHotspotRow hotspots={step.hotspots} disabled={disabled} onChoose={onChoose} />
        {childrenFooter}
      </div>
    </div>
  );
}
