import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { stepAnalysisText } from "../../missionText";
import type { Hotspot, StepPublic } from "../../types";
import { hotspotByVariant } from "./hotspotHelpers";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";
import { mockTicketActivity } from "./simMockData";
import { seedFromStepId } from "./simMicroUiHelpers";

const TICKET_STATUSES = ["Новый", "В работе", "Ожидает ответа", "Решён"] as const;
type TicketStatus = (typeof TICKET_STATUSES)[number];

const PRIORITIES = ["P4 — низкий", "P3 — обычный", "P2 — высокий", "P1 — критичный"] as const;

function collectTicketHandled(step: StepPublic, actionHotspots: Hotspot[]): Set<string> {
  const handled = new Set<string>();
  const push = (h: Hotspot | undefined) => {
    if (h) {
      handled.add(h.id);
    }
  };
  push(hotspotByVariant(step, "ATTACHMENT"));
  push(hotspotByVariant(step, "REPLY"));
  actionHotspots.forEach((h) => handled.add(h.id));
  return handled;
}

export function TicketSimulation(props: {
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

  const attachHs = hotspotByVariant(step, "ATTACHMENT");
  const replyHs = hotspotByVariant(step, "REPLY");
  const actionHotspots = step.hotspots.filter((h) => h.variant.toUpperCase() === "ACTION");

  const handled = collectTicketHandled(step, actionHotspots);
  const orphan = step.hotspots.filter((h) => !handled.has(h.id));

  const [status, setStatus] = useState<TicketStatus>("Новый");
  const [watching, setWatching] = useState(false);
  const [assignee, setAssignee] = useState<string>("Не назначен");
  const [ticketToast, setTicketToast] = useState<string | null>(null);
  const [priority, setPriority] = useState<string>(PRIORITIES[1]);
  const [internalNote, setInternalNote] = useState("");

  const activityLog = useMemo(() => mockTicketActivity(step.id), [step.id]);

  useEffect(() => {
    setStatus("Новый");
    setWatching(false);
    setAssignee("Не назначен");
    setTicketToast(null);
    setPriority(PRIORITIES[1]);
    setInternalNote("");
  }, [step.id]);

  useEffect(() => {
    if (!ticketToast) {
      return;
    }
    const t = window.setTimeout(() => setTicketToast(null), 2200);
    return () => clearTimeout(t);
  }, [ticketToast]);

  const seed = seedFromStepId(step.id);
  const sla = useMemo(() => {
    const h = 1 + (seed % 5);
    const m = (seed >> 3) % 56;
    return { h, m };
  }, [seed]);

  const colleagueNotes = useMemo(() => {
    const a = { who: "Илья · L1", text: "Похоже на типовой фишинг: сверьте Reply-To и видимого отправителя." };
    const b = {
      who: "Марина · ИБ",
      text: "Если ссылка ведёт не на корпоративный домен — эскалация, даже при «зелёном» замке.",
    };
    const c = { who: "Бот SLA", text: "Напоминание: ответ по SLA не снимает необходимость проверить домен вручную." };
    return seed % 2 === 0 ? [a, b, c] : [b, a, c];
  }, [seed]);

  const ASSIGN = ["Не назначен", "Очередь L1", "Илья К.", "Марина (ИБ)"] as const;

  return (
    <div className="ui-frame ui-frame-ticket sim-ticket-layout">
      {ticketToast ? <div className="sim-mini-toast">{ticketToast}</div> : null}
      <div className="sim-ticket-grid">
        <aside className="sim-ticket-aside">
          <div className="sim-ticket-aside-label">Тикет</div>
          <div className="sim-ticket-id">INC-{step.id.slice(-4).toUpperCase()}</div>
          <div className="sim-ticket-aside-meta">ИБ · мониторинг</div>
          <label className="sim-ticket-status-field">
            <span className="sim-ticket-status-label">Статус</span>
            <select
              className="sim-ticket-status-select"
              value={status}
              title="Смена статуса учебная — на оценку задания не влияет"
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
            >
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="sim-ticket-sla" title="Учебные значения SLA, не влияют на оценку">
            <span className="sim-ticket-sla-label">SLA первого ответа</span>
            <span className="sim-ticket-sla-value">
              ~{sla.h}ч {sla.m}м
            </span>
          </div>
        </aside>
        <div className="sim-ticket-main">
          <div className="sim-ticket-toolbar">
            <button
              type="button"
              className={watching ? "sim-ticket-tool sim-ticket-tool--on" : "sim-ticket-tool"}
              title="Следить за тикетом (локально, на оценку не влияет)"
              onClick={() => setWatching((w) => !w)}
            >
              {watching ? "★ Слежу" : "☆ Следить"}
            </button>
            <label className="sim-ticket-assign">
              <span className="sim-ticket-assign-label">Исполнитель</span>
              <select
                className="sim-ticket-assign-select"
                value={assignee}
                title="Назначение учебное"
                onChange={(e) => {
                  setAssignee(e.target.value);
                  setTicketToast(`Исполнитель: ${e.target.value} (симуляция)`);
                }}
              >
                {ASSIGN.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="sim-ticket-tool"
              onClick={() => setTicketToast("Ссылка на тикет скопирована (имитация)")}
            >
              Копировать ссылку
            </button>
            <label className="sim-ticket-assign">
              <span className="sim-ticket-assign-label">Приоритет</span>
              <select
                className="sim-ticket-assign-select"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setTicketToast(`Приоритет: ${e.target.value.split("—")[0]?.trim() ?? ""}`);
                }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="ticket-header sim-ticket-header">
            <span className="ticket-priority">{priority.split("—")[0]?.trim() ?? "P3"}</span>
            <h2 className="ticket-title">{subject}</h2>
            <p className="ticket-from">{from}</p>
          </div>
          <div className="sim-ticket-activity" aria-label="Лента событий">
            <div className="sim-ticket-thread-head">События</div>
            <ul className="sim-ticket-activity-list">
              {activityLog.map((a) => (
                <li key={a.id} className="sim-ticket-activity-item">
                  <span className="sim-ticket-activity-when">{a.when}</span>
                  <span className="sim-ticket-activity-who">{a.who}</span>
                  <p className="sim-ticket-activity-text">{a.text}</p>
                </li>
              ))}
            </ul>
            <div className="sim-ticket-internal-note">
              <label className="sim-ticket-internal-label" htmlFor="sim-ticket-note">
                Внутренняя заметка
              </label>
              <textarea
                id="sim-ticket-note"
                className="sim-ticket-internal-textarea"
                rows={2}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Только для симуляции…"
              />
              <button
                type="button"
                className="sim-ticket-tool"
                onClick={() => {
                  setTicketToast(
                    internalNote.trim()
                      ? "Заметка сохранена только в этом окне."
                      : "Введите текст заметки.",
                  );
                }}
              >
                Сохранить заметку
              </button>
            </div>
          </div>
          <div className="sim-ticket-thread" aria-label="Внутренние комментарии коллег">
            <div className="sim-ticket-thread-head">Комментарии коллег</div>
            <ul className="sim-ticket-thread-list">
              {colleagueNotes.map((c) => (
                <li key={c.who} className="sim-ticket-thread-item">
                  <span className="sim-ticket-thread-who">{c.who}</span>
                  <p className="sim-ticket-thread-text">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="ticket-body sim-ticket-body">
            {splitLayout ? (
              <p className="sim-split-hint sim-ticket-split-hint">Описание тикета — в панели «Условие» слева.</p>
            ) : (
              <div className="narrative-frame">{analysisText}</div>
            )}
            {noise}
          </div>
          <div className="sim-ticket-actions">
            {attachHs ? (
              <button
                type="button"
                className="sim-ticket-attach-btn"
                disabled={disabled}
                onClick={() => onChoose(attachHs.choiceId)}
              >
                <span aria-hidden>📎</span> {attachHs.label}
              </button>
            ) : null}
            {actionHotspots.map((h) => (
              <button
                key={h.id}
                type="button"
                className="btn btn-primary sim-ticket-primary"
                disabled={disabled}
                onClick={() => onChoose(h.choiceId)}
              >
                {h.label}
              </button>
            ))}
            {replyHs ? (
              <button
                type="button"
                className="sim-ticket-secondary"
                disabled={disabled}
                onClick={() => onChoose(replyHs.choiceId)}
              >
                {replyHs.label}
              </button>
            ) : null}
          </div>
          <OrphanHotspotRow hotspots={orphan} disabled={disabled} onChoose={onChoose} />
          {childrenFooter}
        </div>
      </div>
    </div>
  );
}
