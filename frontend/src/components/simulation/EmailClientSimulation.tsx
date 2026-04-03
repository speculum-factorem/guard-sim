import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { Hotspot, StepPublic } from "../../types";
import { hotspotByVariant } from "./hotspotHelpers";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

function collectHandledIds(step: StepPublic, actionHotspots: Hotspot[]): Set<string> {
  const handled = new Set<string>();
  const push = (h: Hotspot | undefined) => {
    if (h) {
      handled.add(h.id);
    }
  };
  push(hotspotByVariant(step, "FROM"));
  push(hotspotByVariant(step, "LINK"));
  push(hotspotByVariant(step, "REPLY"));
  push(hotspotByVariant(step, "ATTACHMENT"));
  actionHotspots.forEach((h) => handled.add(h.id));
  return handled;
}

const GMAIL_FOLDERS = [
  { id: "inbox", label: "Входящие" },
  { id: "star", label: "Помеченные" },
  { id: "snooze", label: "Отложенные" },
  { id: "sent", label: "Отправленные" },
  { id: "drafts", label: "Черновики" },
  { id: "trash", label: "Корзина" },
] as const;

function flashClass(key: string, active: string | null): string {
  return active === key ? "sim-interactive-flash" : "";
}

export function EmailClientSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, childrenFooter, splitLayout = false } = props;
  const subject = step.emailSubject ?? "Без темы";
  const from = step.emailFrom ?? "—";
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;

  const fromHs = hotspotByVariant(step, "FROM");
  const linkHs = hotspotByVariant(step, "LINK");
  const replyHs = hotspotByVariant(step, "REPLY");
  const attachHs = hotspotByVariant(step, "ATTACHMENT");
  const actionHotspots = step.hotspots.filter((h) => h.variant.toUpperCase() === "ACTION");

  const handled = collectHandledIds(step, actionHotspots);
  const orphan = step.hotspots.filter((h) => !handled.has(h.id));

  const [mailSearch, setMailSearch] = useState("");
  const [folderId, setFolderId] = useState<string>("inbox");
  const [composeOpen, setComposeOpen] = useState(false);
  const [toolFlash, setToolFlash] = useState<string | null>(null);

  const pulseTool = useCallback((id: string) => {
    setToolFlash(id);
    window.setTimeout(() => setToolFlash(null), 220);
  }, []);

  useEffect(() => {
    setMailSearch("");
    setFolderId("inbox");
    setComposeOpen(false);
  }, [step.id]);

  return (
    <div className="ui-frame ui-frame-email sim-gmail-root sim-email-layout">
      {composeOpen ? (
        <div className="sim-interactive-toast" role="dialog" aria-label="Новое письмо">
          <p>В учебной симуляции отправка писем отключена.</p>
          <button type="button" className="btn btn-primary" onClick={() => setComposeOpen(false)}>
            Понятно
          </button>
        </div>
      ) : null}

      <header className="sim-gmail-header">
        <button
          type="button"
          className={`sim-gmail-icon-btn ${flashClass("menu", toolFlash)}`}
          title="Меню"
          onClick={() => pulseTool("menu")}
        >
          ☰
        </button>
        <span className="sim-gmail-product">Почта</span>
        <div className="sim-gmail-search-wrap">
          <span className="sim-gmail-search-icon" aria-hidden>
            🔍
          </span>
          <input
            className="sim-gmail-search"
            type="search"
            value={mailSearch}
            onChange={(e) => setMailSearch(e.target.value)}
            placeholder="Поиск в почте"
            aria-label="Поиск в почте (учебная симуляция, без запроса на сервер)"
          />
        </div>
        <div className="sim-gmail-header-actions">
          <button
            type="button"
            className={`sim-gmail-header-ico sim-gmail-header-ico-btn ${flashClass("help", toolFlash)}`}
            title="Справка"
            onClick={() => pulseTool("help")}
          >
            ?
          </button>
          <button
            type="button"
            className={`sim-gmail-header-ico sim-gmail-header-ico-btn ${flashClass("settings", toolFlash)}`}
            title="Настройки"
            onClick={() => pulseTool("settings")}
          >
            ⚙
          </button>
          <button
            type="button"
            className={`sim-gmail-header-ico sim-gmail-header-ico-btn ${flashClass("apps", toolFlash)}`}
            title="Приложения"
            onClick={() => pulseTool("apps")}
          >
            ▦
          </button>
        </div>
      </header>

      <div className="sim-gmail-body">
        <aside className="sim-gmail-rail" aria-label="Папки">
          <button type="button" className="sim-gmail-compose" onClick={() => setComposeOpen(true)}>
            Написать
          </button>
          <nav className="sim-gmail-folders">
            {GMAIL_FOLDERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={
                  folderId === f.id ? "sim-gmail-folder sim-gmail-folder-active" : "sim-gmail-folder"
                }
                aria-current={folderId === f.id ? "true" : undefined}
                onClick={() => setFolderId(f.id)}
              >
                {f.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="sim-gmail-split">
          <div className="sim-gmail-list-col" aria-label="Список писем">
            <button
              type="button"
              className="sim-gmail-list-row sim-gmail-list-row-active"
              onClick={() => setFolderId("inbox")}
            >
              <span className="sim-gmail-list-from">{from}</span>
              <span className="sim-gmail-list-subject">{subject}</span>
              <span className="sim-gmail-list-snippet">—</span>
            </button>
          </div>

          <div className="sim-email-reading">
            {folderId !== "inbox" ? (
              <p className="sim-interactive-hint" role="status">
                Задание относится к папке «Входящие». Выберите её слева, если переключились.
              </p>
            ) : null}
            <div className="sim-email-reading-toolbar">
              <button
                type="button"
                className={`sim-email-tool ${flashClass("back", toolFlash)}`}
                title="Назад"
                onClick={() => pulseTool("back")}
              >
                ←
              </button>
              <button
                type="button"
                className={`sim-email-tool ${flashClass("refresh", toolFlash)}`}
                title="Обновить"
                onClick={() => pulseTool("refresh")}
              >
                ↻
              </button>
              {replyHs ? (
                <button
                  type="button"
                  className="sim-email-tool sim-email-tool-primary"
                  disabled={disabled}
                  onClick={() => onChoose(replyHs.choiceId)}
                >
                  Ответить
                </button>
              ) : (
                <button type="button" className="sim-email-tool" title="Ответить" onClick={() => pulseTool("replyDecoy")}>
                  Ответить
                </button>
              )}
              <button
                type="button"
                className={`sim-email-tool ${flashClass("more", toolFlash)}`}
                title="Ещё"
                onClick={() => pulseTool("more")}
              >
                ⋯
              </button>
            </div>
            <div className="email-meta">
              <div className="email-meta-row">
                <span className="email-meta-label">Тема</span>
                <span className="email-meta-value">{subject}</span>
              </div>
              <div className="email-meta-row email-meta-from-row">
                <span className="email-meta-label">От</span>
                {fromHs ? (
                  <button
                    type="button"
                    className="email-meta-value email-meta-from sim-email-from-btn"
                    disabled={disabled}
                    onClick={() => onChoose(fromHs.choiceId)}
                  >
                    {from}
                  </button>
                ) : (
                  <span className="email-meta-value email-meta-from">{from}</span>
                )}
              </div>
            </div>
            {splitLayout ? (
              <p className="sim-split-hint sim-email-split-hint">Текст письма — в панели «Условие» слева. Ниже — элементы интерфейса.</p>
            ) : (
              <div className="narrative-frame sim-email-body">{step.narrative}</div>
            )}
            {linkHs ? (
              <div className="sim-email-inline-link-wrap">
                <button
                  type="button"
                  className="sim-email-inline-link"
                  disabled={disabled}
                  onClick={() => onChoose(linkHs.choiceId)}
                >
                  {linkHs.label}
                </button>
              </div>
            ) : null}
            {attachHs ? (
              <div className="sim-email-attachment">
                <span className="sim-email-attachment-icon" aria-hidden>
                  📎
                </span>
                <button
                  type="button"
                  className="sim-email-attachment-name"
                  disabled={disabled}
                  onClick={() => onChoose(attachHs.choiceId)}
                >
                  {attachHs.label}
                </button>
              </div>
            ) : null}
            {actionHotspots.length > 0 ? (
              <div className="sim-email-action-strip sim-email-action-row">
                {actionHotspots.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className="btn btn-primary sim-email-action-main"
                    disabled={disabled}
                    onClick={() => onChoose(h.choiceId)}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            ) : null}
            {noise}
            <OrphanHotspotRow hotspots={orphan} disabled={disabled} onChoose={onChoose} />
            {childrenFooter}
          </div>
        </div>
      </div>
    </div>
  );
}
