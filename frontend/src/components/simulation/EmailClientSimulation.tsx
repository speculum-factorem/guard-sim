import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { stepAnalysisText } from "../../missionText";
import type { Hotspot, StepPublic } from "../../types";
import { hotspotByVariant } from "./hotspotHelpers";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";
import { mockFolderRows, mockInboxRows, mockMailBodyForRow, type MockMailRow } from "./simMockData";
import { extractEmailFromHeader, syntheticReplyTo } from "./simMicroUiHelpers";

const EMPTY_MOCK_ROWS: MockMailRow[] = [];

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

type EmailPanel = "menu" | "help" | "settings" | "apps" | "more" | "replyDecoy";

export function EmailClientSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, childrenFooter, splitLayout = false } = props;
  const analysisText = stepAnalysisText(step);
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
  const [panel, setPanel] = useState<EmailPanel | null>(null);
  const [listOnly, setListOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [miniToast, setMiniToast] = useState<string | null>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [settings, setSettings] = useState({ promo: true, importance: true, images: false });
  const [activeMailId, setActiveMailId] = useState(() => `task-${step.id}`);
  const [starredIds, setStarredIds] = useState<Record<string, boolean>>({});

  const taskRowId = `task-${step.id}`;
  const technicalFrom = extractEmailFromHeader(from);
  const replyMeta = syntheticReplyTo(step.id, from);

  const showToast = useCallback((msg: string) => setMiniToast(msg), []);

  const runRefresh = useCallback(() => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 900);
  }, []);

  const inboxRows: MockMailRow[] = useMemo(
    () => mockInboxRows(step.id, from, subject),
    [step.id, from, subject],
  );
  const folderRows: MockMailRow[] = useMemo(
    () => (folderId === "inbox" ? EMPTY_MOCK_ROWS : mockFolderRows(folderId, step.id)),
    [folderId, step.id],
  );
  const listRows: MockMailRow[] = folderId === "inbox" ? inboxRows : folderRows;

  const filteredRows = useMemo(() => {
    const q = mailSearch.trim().toLowerCase();
    if (!q) {
      return listRows;
    }
    return listRows.filter(
      (r) =>
        r.from.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.snippet.toLowerCase().includes(q),
    );
  }, [listRows, mailSearch]);

  useEffect(() => {
    if (filteredRows.length === 0) {
      return;
    }
    if (!filteredRows.some((r) => r.id === activeMailId)) {
      const first = filteredRows[0];
      if (first) {
        setActiveMailId(first.id);
      }
    }
  }, [filteredRows, activeMailId]);

  const activeRow = useMemo(() => listRows.find((r) => r.id === activeMailId), [listRows, activeMailId]);
  const showTaskReading =
    Boolean(activeRow?.isTask) && folderId === "inbox" && !listOnly && activeMailId === taskRowId;

  const toggleStar = useCallback((id: string) => {
    setStarredIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  useEffect(() => {
    setMailSearch("");
    setFolderId("inbox");
    setComposeOpen(false);
    setPanel(null);
    setListOnly(false);
    setRefreshing(false);
    setMiniToast(null);
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setReplyDraft("");
    setStarredIds({});
    setActiveMailId(`task-${step.id}`);
  }, [step.id]);

  useEffect(() => {
    if (!miniToast) {
      return;
    }
    const t = window.setTimeout(() => setMiniToast(null), 2400);
    return () => clearTimeout(t);
  }, [miniToast]);

  const openFolderFromMenu = (id: string) => {
    setFolderId(id);
    setPanel(null);
    setListOnly(false);
    if (id === "inbox") {
      setActiveMailId(taskRowId);
    } else {
      const rows = mockFolderRows(id, step.id);
      if (rows[0]) {
        setActiveMailId(rows[0].id);
      }
    }
  };

  return (
    <div className="ui-frame ui-frame-email sim-gmail-root sim-email-layout">
      {miniToast ? <div className="sim-mini-toast">{miniToast}</div> : null}

      {composeOpen ? (
        <>
          <button type="button" className="sim-sim-backdrop" aria-label="Закрыть окно" onClick={() => setComposeOpen(false)} />
          <div
            className="sim-email-compose-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sim-compose-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="sim-compose-title" style={{ margin: "0 0 14px", fontSize: "1.1rem" }}>
              Новое письмо
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--gm-text-secondary)" }}>
              Поля работают локально; отправка в учебной среде отключена.
            </p>
            <label className="sim-email-form-row">
              <span>Кому</span>
              <input
                className="sim-email-form-input"
                type="email"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="name@company.com"
                autoComplete="off"
              />
            </label>
            <label className="sim-email-form-row">
              <span>Тема</span>
              <input
                className="sim-email-form-input"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Тема"
                autoComplete="off"
              />
            </label>
            <label className="sim-email-form-row sim-email-form-row--area">
              <span>Текст</span>
              <textarea
                className="sim-email-form-textarea"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                rows={5}
                placeholder="Текст письма…"
              />
            </label>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" className="btn" onClick={() => setComposeOpen(false)}>
                Закрыть
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  showToast("Сохранено в «Черновиках» — отправка в симуляции не выполняется.");
                  setComposeOpen(false);
                }}
              >
                Отправить
              </button>
            </div>
          </div>
        </>
      ) : null}

      {panel === "menu" ? (
        <>
          <button type="button" className="sim-sim-backdrop" aria-label="Закрыть меню" onClick={() => setPanel(null)} />
          <aside className="sim-email-drawer" role="dialog" aria-label="Меню навигации">
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Папки</div>
            <nav className="sim-email-drawer-nav">
              {GMAIL_FOLDERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={folderId === f.id ? "sim-email-drawer-link sim-email-drawer-link--active" : "sim-email-drawer-link"}
                  onClick={() => openFolderFromMenu(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </nav>
            <button type="button" className="btn" style={{ marginTop: 16, width: "100%" }} onClick={() => setPanel(null)}>
              Закрыть
            </button>
          </aside>
        </>
      ) : null}

      {panel === "help" ? (
        <>
          <button type="button" className="sim-sim-backdrop" aria-label="Закрыть" onClick={() => setPanel(null)} />
          <div className="sim-modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 10px" }}>Справка по симуляции</h3>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.5 }}>
              <li>Проверяйте технические заголовки и несовпадение Reply-To.</li>
              <li>Замок и имя в «От» легко подделать — смотрите реальный адрес.</li>
              <li>Ответы, влияющие на оценку, отмечены в условии шага.</li>
            </ul>
            <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setPanel(null)}>
              Понятно
            </button>
          </div>
        </>
      ) : null}

      {panel === "settings" ? (
        <>
          <button type="button" className="sim-sim-backdrop" aria-label="Закрыть" onClick={() => setPanel(null)} />
          <div className="sim-modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 14px" }}>Быстрые настройки</h3>
            <label className="sim-email-check">
              <input
                type="checkbox"
                checked={settings.promo}
                onChange={(e) => setSettings((s) => ({ ...s, promo: e.target.checked }))}
              />
              Рекламные рассылки в «Входящие»
            </label>
            <label className="sim-email-check">
              <input
                type="checkbox"
                checked={settings.importance}
                onChange={(e) => setSettings((s) => ({ ...s, importance: e.target.checked }))}
              />
              Метки важности
            </label>
            <label className="sim-email-check">
              <input
                type="checkbox"
                checked={settings.images}
                onChange={(e) => setSettings((s) => ({ ...s, images: e.target.checked }))}
              />
              Показывать внешние изображения
            </label>
            <p style={{ fontSize: 12, color: "var(--gm-text-secondary)", margin: "12px 0 0" }}>
              Настройки действуют только в интерфейсе симуляции на этом шаге.
            </p>
            <button type="button" className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setPanel(null)}>
              Готово
            </button>
          </div>
        </>
      ) : null}

      {panel === "apps" ? (
        <>
          <button type="button" className="sim-sim-backdrop" aria-label="Закрыть" onClick={() => setPanel(null)} />
          <div className="sim-modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 14px" }}>Приложения Google</h3>
            <div className="sim-email-apps-grid">
              {["Календарь", "Контакты", "Диск", "Документы", "Чат", "Таблицы"].map((name) => (
                <button
                  key={name}
                  type="button"
                  className="sim-email-app-tile"
                  onClick={() => {
                    showToast(`${name}: недоступно в симуляции`);
                    setPanel(null);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <button type="button" className="btn" style={{ marginTop: 12 }} onClick={() => setPanel(null)}>
              Закрыть
            </button>
          </div>
        </>
      ) : null}

      {panel === "more" ? (
        <>
          <button type="button" className="sim-sim-backdrop" aria-label="Закрыть" onClick={() => setPanel(null)} />
          <div className="sim-modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px" }}>Дополнительно</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  showToast("Пересылка: имитация, письмо не уходит");
                  setPanel(null);
                }}
              >
                Переслать
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  showToast("Печать: превью открыто бы (симуляция)");
                  setPanel(null);
                }}
              >
                Печать
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  showToast("Жалоба записана только в симуляции");
                  setPanel(null);
                }}
              >
                Пожаловаться на спам
              </button>
            </div>
          </div>
        </>
      ) : null}

      {panel === "replyDecoy" ? (
        <>
          <button type="button" className="sim-sim-backdrop" aria-label="Закрыть" onClick={() => setPanel(null)} />
          <div className="sim-modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 10px" }}>Ответ</h3>
            <p style={{ fontSize: 13, color: "var(--gm-text-secondary)", margin: "0 0 10px" }}>
              Черновик хранится локально. Чтобы засчитать ответ по заданию, используйте кнопки в условии, если они есть.
            </p>
            <textarea
              className="sim-email-form-textarea"
              rows={6}
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              placeholder={`Re: ${subject}`}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" className="btn" onClick={() => setPanel(null)}>
                Закрыть
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  showToast("Черновик ответа сохранён локально (симуляция).");
                  setPanel(null);
                }}
              >
                Отправить
              </button>
            </div>
          </div>
        </>
      ) : null}

      <header className="sim-gmail-header sim-app-bar">
        <button type="button" className="app-nav-pill app-nav-pill--icon" title="Меню" onClick={() => setPanel("menu")}>
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
          <button type="button" className="app-nav-pill app-nav-pill--icon" title="Справка" onClick={() => setPanel("help")}>
            ?
          </button>
          <button type="button" className="app-nav-pill app-nav-pill--icon" title="Настройки" onClick={() => setPanel("settings")}>
            ⚙
          </button>
          <button type="button" className="app-nav-pill app-nav-pill--icon" title="Приложения" onClick={() => setPanel("apps")}>
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
                className={folderId === f.id ? "sim-gmail-folder sim-gmail-folder-active" : "sim-gmail-folder"}
                aria-current={folderId === f.id ? "true" : undefined}
                onClick={() => {
                  setFolderId(f.id);
                  setListOnly(false);
                  if (f.id === "inbox") {
                    setActiveMailId(taskRowId);
                  } else {
                    const rows = mockFolderRows(f.id, step.id);
                    if (rows[0]) {
                      setActiveMailId(rows[0].id);
                    }
                  }
                }}
              >
                {f.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="sim-gmail-split">
          <div className="sim-gmail-list-col" aria-label="Список писем">
            {filteredRows.length === 0 ? (
              <p className="sim-gmail-list-empty">Писем не найдено — смените поиск или папку.</p>
            ) : (
              filteredRows.map((row) => (
                <div key={row.id} className="sim-gmail-list-row-wrap">
                  <button
                    type="button"
                    className={starredIds[row.id] ? "sim-gmail-star-btn sim-gmail-star-btn--on" : "sim-gmail-star-btn"}
                    aria-label={starredIds[row.id] ? "Снять метку" : "Пометить звездой"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(row.id);
                    }}
                  >
                    {starredIds[row.id] ? "★" : "☆"}
                  </button>
                  <button
                    type="button"
                    className={
                      activeMailId === row.id ? "sim-gmail-list-row sim-gmail-list-row-active" : "sim-gmail-list-row"
                    }
                    onClick={() => {
                      setActiveMailId(row.id);
                      setListOnly(false);
                      if (folderId === "inbox") {
                        setFolderId("inbox");
                      }
                    }}
                  >
                    <span className="sim-gmail-list-from">{row.from}</span>
                    <span className="sim-gmail-list-subject">{row.subject}</span>
                    <span className="sim-gmail-list-snippet">{row.snippet}</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="sim-email-reading" style={{ position: "relative" }}>
            {refreshing ? (
              <div className="sim-email-refresh-overlay" role="status">
                Обновление входящих…
              </div>
            ) : null}
            {folderId !== "inbox" ? (
              <p className="sim-interactive-hint" role="status">
                Задание относится к папке «Входящие». Выберите её слева, если переключились.
              </p>
            ) : null}
            {listOnly ? (
              <div className="sim-email-reading--list-only">
                <p>Выберите письмо в списке слева или откройте письмо с заданием.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setFolderId("inbox");
                    setActiveMailId(taskRowId);
                    setListOnly(false);
                  }}
                >
                  Письмо с заданием
                </button>
              </div>
            ) : (
              <>
                <div className="sim-email-reading-toolbar sim-app-bar sim-app-bar--sub">
                  <button
                    type="button"
                    className="app-nav-pill app-nav-pill--icon"
                    title="К списку писем"
                    onClick={() => setListOnly(true)}
                  >
                    ←
                  </button>
                  <button type="button" className="app-nav-pill app-nav-pill--icon" title="Обновить" onClick={runRefresh}>
                    ↻
                  </button>
                  {replyHs ? (
                    <button
                      type="button"
                      className="app-nav-pill app-nav-pill--natural app-nav-pill--primary"
                      disabled={disabled}
                      onClick={() => onChoose(replyHs.choiceId)}
                    >
                      Ответить
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="app-nav-pill app-nav-pill--natural"
                      title="Ответить (черновик)"
                      onClick={() => setPanel("replyDecoy")}
                    >
                      Ответить
                    </button>
                  )}
                  <button type="button" className="app-nav-pill app-nav-pill--icon" title="Ещё действия" onClick={() => setPanel("more")}>
                    ⋯
                  </button>
                </div>
                {showTaskReading ? (
                  <>
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
                            title={`Технический адрес отправителя: ${technicalFrom}`}
                            disabled={disabled}
                            onClick={() => onChoose(fromHs.choiceId)}
                          >
                            {from}
                          </button>
                        ) : (
                          <span className="email-meta-value email-meta-from" title={`Технический адрес: ${technicalFrom}`}>
                            {from}
                          </span>
                        )}
                      </div>
                      <details className="sim-email-headers-more">
                        <summary className="sim-email-headers-more-summary">Технические заголовки</summary>
                        <div className="sim-email-headers-grid">
                          <div className="sim-email-hdr-row">
                            <span className="sim-email-hdr-label">Reply-To</span>
                            <span
                              className={`sim-email-hdr-value${replyMeta.suspicious ? " sim-email-hdr-value--warn" : ""}`}
                              title={
                                replyMeta.suspicious
                                  ? "Внимание: Reply-To не совпадает с видимым отправителем — типичный признак подделки"
                                  : "Совпадает с адресом отправителя"
                              }
                            >
                              {replyMeta.address}
                            </span>
                          </div>
                          <div className="sim-email-hdr-row">
                            <span className="sim-email-hdr-label">Return-Path</span>
                            <span
                              className="sim-email-hdr-value sim-email-hdr-value--muted"
                              title="Путь возврата при доставке; в учебной симуляции значение условное"
                            >
                              {`<bounces@${technicalFrom.includes("@") ? technicalFrom.split("@")[1] : "mail.local"}>`}
                            </span>
                          </div>
                        </div>
                      </details>
                    </div>
                    {splitLayout ? (
                      <p className="sim-split-hint sim-email-split-hint">
                        Текст письма — в панели «Условие» слева. Ниже — элементы интерфейса.
                      </p>
                    ) : (
                      <div className="narrative-frame sim-email-body">{analysisText}</div>
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
                    <div className="sim-email-attachments-wrap" aria-label="Вложения">
                      <details className="sim-email-attach-decoy">
                        <summary className="sim-email-attach-summary">
                          <span className="sim-email-attachment-icon" aria-hidden>
                            📎
                          </span>
                          <span>Payroll_Q4.xls.exe</span>
                          <span className="sim-email-attach-meta">128 КБ</span>
                        </summary>
                        <p className="sim-email-attach-note">
                          Учебная подсказка: двойное расширение и запуск вложений из писем — частый вектор атаки. В задании это
                          вложение не связано с правильным ответом.
                        </p>
                      </details>
                      {attachHs ? (
                        <details className="sim-email-attach-real" open>
                          <summary className="sim-email-attach-summary">
                            <span className="sim-email-attachment-icon" aria-hidden>
                              📎
                            </span>
                            <span>Вложение к заданию</span>
                          </summary>
                          <div className="sim-email-attachment sim-email-attachment--in-details">
                            <button
                              type="button"
                              className="sim-email-attachment-name"
                              disabled={disabled}
                              onClick={() => onChoose(attachHs.choiceId)}
                            >
                              {attachHs.label}
                            </button>
                            <p className="sim-email-attach-hint">Нажмите, если это вложение из условия сценария.</p>
                          </div>
                        </details>
                      ) : null}
                    </div>
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
                  </>
                ) : activeRow ? (
                  <div className="sim-email-secondary-read">
                    <div className="email-meta">
                      <div className="email-meta-row">
                        <span className="email-meta-label">Тема</span>
                        <span className="email-meta-value">{activeRow.subject}</span>
                      </div>
                      <div className="email-meta-row email-meta-from-row">
                        <span className="email-meta-label">От</span>
                        <span className="email-meta-value">{activeRow.from}</span>
                      </div>
                    </div>
                    <div className="narrative-frame sim-email-body">{mockMailBodyForRow(activeRow)}</div>
                    <div className="sim-email-secondary-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setFolderId("inbox");
                          setActiveMailId(taskRowId);
                          showToast("Переход ко входящим с заданием.");
                        }}
                      >
                        {folderId === "inbox" ? "К письму с заданием" : "Открыть «Входящие» с заданием"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="sim-interactive-hint" role="status">
                    Выберите письмо в списке слева.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
