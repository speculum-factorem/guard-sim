import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

function tabTitleFromQuery(query: string): string {
  const t = query.trim();
  if (!t) return "Поиск";
  if (t.length <= 22) return `Поиск: ${t}`;
  return `Поиск: ${t.slice(0, 19)}…`;
}

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
  const [reloading, setReloading] = useState(false);
  const [chromeMenuOpen, setChromeMenuOpen] = useState(false);
  const [omniboxPulse, setOmniboxPulse] = useState(false);
  const omniboxRef = useRef<HTMLInputElement>(null);

  const searchUrl = useMemo(
    () => `https://search.guardsim.local/search?q=${encodeURIComponent(g.query)}`,
    [g.query],
  );
  const tabTitle = useMemo(() => tabTitleFromQuery(g.query), [g.query]);

  useEffect(() => {
    setToast(null);
    setChromeMenuOpen(false);
    setReloading(false);
    setOmniboxPulse(true);
    const endPulse = window.setTimeout(() => setOmniboxPulse(false), 2200);
    const raf = window.requestAnimationFrame(() => {
      omniboxRef.current?.focus({ preventScroll: true });
    });
    return () => {
      clearTimeout(endPulse);
      cancelAnimationFrame(raf);
    };
  }, [step.id]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const onFakeSearch = useCallback(() => {
    setToast("В этом окне поиск не уходит в интернет — выберите результат из списка ниже.");
  }, []);

  const runReload = useCallback(() => {
    setReloading(true);
    window.setTimeout(() => setReloading(false), 750);
  }, []);

  return (
    <div className="ui-frame ui-frame-serp-search sim-browser-layout sim-chrome-root">
      {toast ? <div className="sim-mini-toast">{toast}</div> : null}
      <div className="browser-chrome-chrome sim-app-bar">
        <div className="browser-chrome-titlebar" aria-hidden>
          <span className="browser-chrome-dot browser-chrome-dot-r" />
          <span className="browser-chrome-dot browser-chrome-dot-y" />
          <span className="browser-chrome-dot browser-chrome-dot-g" />
        </div>
        <div className="browser-chrome-tabstrip" role="tablist">
          <div className="browser-tab-row browser-tab-row-active">
            <div className="browser-tab-main" style={{ cursor: "default" }}>
              <span className="browser-tab-favicon" aria-hidden />
              <span className="browser-tab-title">{tabTitle}</span>
            </div>
          </div>
        </div>
        <div className="browser-chrome-toolbar-wrap">
          <div className="browser-chrome-toolbar">
            <div className="browser-chrome-nav">
              <button type="button" className="app-nav-pill app-nav-pill--icon" title="Назад" disabled>
                ←
              </button>
              <button type="button" className="app-nav-pill app-nav-pill--icon" title="Вперёд" disabled>
                →
              </button>
              <button
                type="button"
                className={`app-nav-pill app-nav-pill--icon browser-nav-reload${reloading ? " sim-browser-reloading" : ""}`}
                title="Обновить"
                onClick={runReload}
              >
                ↻
              </button>
            </div>
            <label
              className={`browser-chrome-omnibox sim-chrome-omnibox browser-omnibox-label${
                omniboxPulse ? " browser-chrome-omnibox--pulse" : ""
              }`}
            >
              <span
                className="browser-chrome-lock browser-chrome-lock--sim"
                title="Учебный браузер GuardSim: запрос не уходит в сеть. Сверяйте домены в выдаче."
              >
                🔒
              </span>
              <input
                ref={omniboxRef}
                className="browser-chrome-url-input"
                type="text"
                readOnly
                value={searchUrl}
                aria-label="Адресная строка поиска (без выхода в интернет)"
              />
            </label>
            <button
              type="button"
              className="app-nav-pill app-nav-pill--primary sim-serp-toolbar-search-btn"
              disabled={disabled}
              onClick={onFakeSearch}
            >
              Найти
            </button>
            <div className="browser-chrome-toolbar-end">
              <button
                type="button"
                className="app-nav-pill app-nav-pill--icon"
                title="Меню"
                aria-expanded={chromeMenuOpen}
                onClick={() => setChromeMenuOpen((v) => !v)}
              >
                ⋮
              </button>
            </div>
          </div>
          {chromeMenuOpen ? (
            <>
              <button
                type="button"
                className="sim-sim-backdrop"
                style={{ zIndex: 44 }}
                aria-label="Закрыть меню"
                onClick={() => setChromeMenuOpen(false)}
              />
              <div className="browser-chrome-menu-popover" role="menu">
                <button
                  type="button"
                  className="browser-chrome-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setToast("История поиска в учебном режиме недоступна");
                    setChromeMenuOpen(false);
                  }}
                >
                  История
                </button>
                <button
                  type="button"
                  className="browser-chrome-menu-item"
                  role="menuitem"
                  onClick={() => {
                    runReload();
                    setChromeMenuOpen(false);
                  }}
                >
                  Перезагрузить страницу
                </button>
              </div>
            </>
          ) : null}
          <div className="browser-chrome-bookmarks" aria-label="Закладки">
            <button
              type="button"
              className="browser-chrome-bookmark"
              onClick={() => setToast("Откройте раздел «Задачи» в основном меню GuardSim")}
            >
              GuardSim · Задачи
            </button>
            <button
              type="button"
              className="browser-chrome-bookmark"
              onClick={() => setToast("Проверяйте домен банка по карте, договору или приложению — не только по выдаче")}
            >
              Памятка по доменам
            </button>
          </div>
        </div>
      </div>

      <div className="sim-browser-content sim-serp-page">
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
