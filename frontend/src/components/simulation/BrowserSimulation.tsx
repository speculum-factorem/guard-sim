import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

/** Текст в адресной строке браузера: подпись задачи или запасной нейтральный URL. */
function omniboxDisplay(caption: string): string {
  const t = caption.trim();
  if (t.length <= 72) {
    return t || "https://guardsim.local/verify";
  }
  return `${t.slice(0, 69)}…`;
}

function flashNav(active: string | null, key: string): string {
  return active === key ? "sim-interactive-flash" : "";
}

export function BrowserSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
}) {
  const { step, disabled, onChoose, childrenFooter } = props;
  const g = step.urlCompareGame;
  if (!g) {
    return null;
  }
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const tabTitle = g.caption.trim()
    ? g.caption.length > 24
      ? `${g.caption.slice(0, 21)}…`
      : g.caption
    : "Сравнение URL";

  const [omnibox, setOmnibox] = useState(() => omniboxDisplay(g.caption));
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [navFlash, setNavFlash] = useState<string | null>(null);

  useEffect(() => {
    setOmnibox(omniboxDisplay(g.caption));
    setActiveTab(0);
  }, [step.id, g.caption]);

  const pulseNav = useCallback((key: string) => {
    setNavFlash(key);
    window.setTimeout(() => setNavFlash(null), 220);
  }, []);

  return (
    <div className="ui-frame ui-frame-url-compare sim-browser-layout sim-chrome-root">
      <div className="browser-chrome-chrome" aria-hidden>
        <div className="browser-chrome-titlebar">
          <span className="browser-chrome-dot browser-chrome-dot-r" />
          <span className="browser-chrome-dot browser-chrome-dot-y" />
          <span className="browser-chrome-dot browser-chrome-dot-g" />
        </div>
        <div className="browser-chrome-tabstrip" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 0}
            className={
              activeTab === 0
                ? "browser-tab-slot browser-tab-slot-active"
                : "browser-tab-slot browser-tab-slot-inactive"
            }
            onClick={() => setActiveTab(0)}
          >
            <span className="browser-tab-favicon" aria-hidden />
            <span className="browser-tab-title">{tabTitle}</span>
            <span className="browser-tab-close" aria-hidden>
              ×
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 1}
            className={
              activeTab === 1
                ? "browser-tab-slot browser-tab-slot-active"
                : "browser-tab-slot browser-tab-slot-inactive"
            }
            onClick={() => setActiveTab(1)}
          >
            <span className="browser-tab-favicon browser-tab-favicon-dim" aria-hidden />
            <span className="browser-tab-title">Новая вкладка</span>
          </button>
          <button
            type="button"
            className="browser-tab-new"
            title="Новая вкладка"
            onClick={() => pulseNav("newtab")}
          >
            +
          </button>
        </div>
        <div className="browser-chrome-toolbar">
          <div className="browser-chrome-nav">
            <button
              type="button"
              className={`browser-nav-btn ${flashNav(navFlash, "back")}`}
              title="Назад"
              onClick={() => pulseNav("back")}
            >
              ←
            </button>
            <button
              type="button"
              className={`browser-nav-btn ${flashNav(navFlash, "forward")}`}
              title="Вперёд"
              onClick={() => pulseNav("forward")}
            >
              →
            </button>
            <button
              type="button"
              className={`browser-nav-btn browser-nav-reload ${flashNav(navFlash, "reload")}`}
              title="Обновить"
              onClick={() => pulseNav("reload")}
            >
              ↻
            </button>
          </div>
          <label className="browser-chrome-omnibox sim-chrome-omnibox browser-omnibox-label">
            <span className="browser-chrome-lock" title="Защищённое соединение (симуляция)">
              🔒
            </span>
            <input
              className="browser-chrome-url-input"
              type="text"
              value={omnibox}
              onChange={(e) => setOmnibox(e.target.value)}
              aria-label="Адресная строка (учебная симуляция, без перехода по сети)"
            />
          </label>
          <div className="browser-chrome-toolbar-end">
            <button
              type="button"
              className={`browser-toolbar-ico browser-toolbar-ico-btn ${flashNav(navFlash, "menu")}`}
              title="Меню Chrome"
              onClick={() => pulseNav("menu")}
            >
              ⋮
            </button>
          </div>
        </div>
      </div>
      {activeTab === 1 ? (
        <p className="sim-interactive-hint sim-browser-tab-hint" role="status">
          Содержимое задания ниже относится к первой вкладке. Переключитесь на неё, если сравниваете URL.
        </p>
      ) : null}
      <div className="sim-browser-content">
        <p className="url-compare-caption">{g.caption}</p>
        {noise}
        <div className="url-compare-grid">
          <button
            type="button"
            className="url-compare-card"
            disabled={disabled}
            onClick={() => onChoose(g.leftChoiceId)}
          >
            <span className="url-compare-label">Вариант A</span>
            <code className="url-compare-url">{g.leftUrl}</code>
          </button>
          <button
            type="button"
            className="url-compare-card"
            disabled={disabled}
            onClick={() => onChoose(g.rightChoiceId)}
          >
            <span className="url-compare-label">Вариант B</span>
            <code className="url-compare-url">{g.rightUrl}</code>
          </button>
        </div>
        <OrphanHotspotRow hotspots={step.hotspots} disabled={disabled} onChoose={onChoose} />
        {childrenFooter}
      </div>
    </div>
  );
}
