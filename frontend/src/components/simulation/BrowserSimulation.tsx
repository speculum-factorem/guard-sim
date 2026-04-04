import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";
import { mockBrowserBookmarks } from "./simMockData";
import { urlCharDiffPair } from "./simMicroUiHelpers";

/** Текст в адресной строке браузера: подпись задачи или запасной нейтральный URL. */
function omniboxDisplay(caption: string): string {
  const t = caption.trim();
  if (t.length <= 72) {
    return t || "https://guardsim.local/verify";
  }
  return `${t.slice(0, 69)}…`;
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

  const pages = useMemo(
    () => [omniboxDisplay(g.caption), g.leftUrl, g.rightUrl],
    [g.caption, g.leftUrl, g.rightUrl],
  );

  const [omnibox, setOmnibox] = useState(() => pages[0] ?? omniboxDisplay(g.caption));
  const [histIdx, setHistIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [reloading, setReloading] = useState(false);
  const [chromeMenuOpen, setChromeMenuOpen] = useState(false);
  const [omniboxPulse, setOmniboxPulse] = useState(false);
  const [tabToast, setTabToast] = useState<string | null>(null);
  const omniboxRef = useRef<HTMLInputElement>(null);

  const urlDiff = useMemo(() => urlCharDiffPair(g.leftUrl, g.rightUrl), [g.leftUrl, g.rightUrl]);
  const bookmarks = useMemo(
    () => mockBrowserBookmarks(g.leftUrl, g.rightUrl, g.caption),
    [g.leftUrl, g.rightUrl, g.caption],
  );

  useEffect(() => {
    const first = pages[0] ?? omniboxDisplay(g.caption);
    setOmnibox(first);
    setHistIdx(0);
    setActiveTab(0);
    setChromeMenuOpen(false);
    setOmniboxPulse(true);
    setReloading(false);
    const endPulse = window.setTimeout(() => setOmniboxPulse(false), 2400);
    const raf = window.requestAnimationFrame(() => {
      omniboxRef.current?.focus({ preventScroll: true });
    });
    return () => {
      clearTimeout(endPulse);
      cancelAnimationFrame(raf);
    };
  }, [step.id, pages, g.caption]);

  useEffect(() => {
    if (!tabToast) {
      return;
    }
    const t = window.setTimeout(() => setTabToast(null), 2000);
    return () => clearTimeout(t);
  }, [tabToast]);

  const goBack = useCallback(() => {
    setHistIdx((i) => {
      const next = Math.max(0, i - 1);
      setOmnibox(pages[next] ?? "");
      return next;
    });
  }, [pages]);

  const goForward = useCallback(() => {
    setHistIdx((i) => {
      const next = Math.min(pages.length - 1, i + 1);
      setOmnibox(pages[next] ?? "");
      return next;
    });
  }, [pages]);

  const runReload = useCallback(() => {
    setReloading(true);
    window.setTimeout(() => setReloading(false), 750);
  }, []);

  const onNewTab = useCallback(() => {
    setActiveTab(1);
    setTabToast("Открыта вторая вкладка — задание на первой.");
  }, []);

  const closeFirstTab = useCallback(() => {
    setActiveTab(1);
    setTabToast("Вкладка с заданием закрыта в симуляции — переключитесь обратно через список вкладок.");
  }, []);

  return (
    <div className="ui-frame ui-frame-url-compare sim-browser-layout sim-chrome-root">
      {tabToast ? <div className="sim-mini-toast">{tabToast}</div> : null}
      <div className="browser-chrome-chrome sim-app-bar" aria-hidden>
        <div className="browser-chrome-titlebar">
          <span className="browser-chrome-dot browser-chrome-dot-r" />
          <span className="browser-chrome-dot browser-chrome-dot-y" />
          <span className="browser-chrome-dot browser-chrome-dot-g" />
        </div>
        <div className="browser-chrome-tabstrip" role="tablist">
          <div
            className={
              activeTab === 0
                ? "browser-tab-row browser-tab-row-active"
                : "browser-tab-row browser-tab-row-inactive"
            }
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 0}
              className="browser-tab-main"
              onClick={() => setActiveTab(0)}
            >
              <span className="browser-tab-favicon" aria-hidden />
              <span className="browser-tab-title">{tabTitle}</span>
            </button>
            <button type="button" className="browser-tab-close-btn" title="Закрыть вкладку" onClick={closeFirstTab}>
              ×
            </button>
          </div>
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
          <button type="button" className="browser-tab-new" title="Новая вкладка" onClick={onNewTab}>
            +
          </button>
        </div>
        <div className="browser-chrome-toolbar-wrap">
          <div className="browser-chrome-toolbar">
            <div className="browser-chrome-nav">
              <button
                type="button"
                className="app-nav-pill app-nav-pill--icon"
                title="Назад"
                disabled={histIdx <= 0}
                onClick={goBack}
              >
                ←
              </button>
              <button
                type="button"
                className="app-nav-pill app-nav-pill--icon"
                title="Вперёд"
                disabled={histIdx >= pages.length - 1}
                onClick={goForward}
              >
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
                title="Симуляция: замок «HTTPS» здесь декоративный. Подделывают и иконку, и адрес — проверяйте домен посимвольно."
              >
                🔒
              </span>
              <input
                ref={omniboxRef}
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
                className="app-nav-pill app-nav-pill--icon"
                title="Меню Chrome"
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
                    setTabToast("История посещений недоступна в симуляции");
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
                    setTabToast("Загрузки: в симуляции пусто");
                    setChromeMenuOpen(false);
                  }}
                >
                  Загрузки
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
                  Очистить кэш и перезагрузить
                </button>
                <button
                  type="button"
                  className="browser-chrome-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setTabToast("Настройки Chrome недоступны в симуляции");
                    setChromeMenuOpen(false);
                  }}
                >
                  Настройки
                </button>
              </div>
            </>
          ) : null}
          <div className="browser-chrome-bookmarks" aria-label="Закладки">
            {bookmarks.map((b) => (
              <button
                key={b.label}
                type="button"
                className="browser-chrome-bookmark"
                onClick={() => {
                  setOmnibox(b.url);
                  const idx = pages.indexOf(b.url);
                  if (idx >= 0) {
                    setHistIdx(idx);
                  }
                  setTabToast(`Закладка «${b.label}»: адрес подставлен в строку.`);
                }}
              >
                {b.label}
              </button>
            ))}
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
        <p className="url-compare-diff-hint" role="note">
          Отличия подсвечены; «Назад» / «Вперёд» листают подпись и оба URL.
        </p>
        {noise}
        <div className="url-compare-grid">
          <button
            type="button"
            className="url-compare-card"
            disabled={disabled}
            onClick={() => onChoose(g.leftChoiceId)}
          >
            <span className="url-compare-label">Вариант A</span>
            <code className="url-compare-url url-compare-url--diff">
              {urlDiff.left.map((c, i) => (
                <span
                  key={`l-${i}`}
                  className={c.diff ? "url-diff-char url-diff-char--diff" : "url-diff-char"}
                >
                  {c.char === "" ? "\u00a0" : c.char}
                </span>
              ))}
            </code>
          </button>
          <button
            type="button"
            className="url-compare-card"
            disabled={disabled}
            onClick={() => onChoose(g.rightChoiceId)}
          >
            <span className="url-compare-label">Вариант B</span>
            <code className="url-compare-url url-compare-url--diff">
              {urlDiff.right.map((c, i) => (
                <span
                  key={`r-${i}`}
                  className={c.diff ? "url-diff-char url-diff-char--diff" : "url-diff-char"}
                >
                  {c.char === "" ? "\u00a0" : c.char}
                </span>
              ))}
            </code>
          </button>
        </div>
        <OrphanHotspotRow hotspots={step.hotspots} disabled={disabled} onChoose={onChoose} />
        {childrenFooter}
      </div>
    </div>
  );
}
