import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPlayerState, fetchScenarios } from "../api";
import { careerTitle } from "../careerLabels";
import type { PlayerState, ScenarioSummary } from "../types";

function typeLabel(t: ScenarioSummary["type"]): string {
  if (t === "EMAIL") {
    return "Почта";
  }
  return "Соцсеть";
}

function typeClass(t: ScenarioSummary["type"]): string {
  return t === "EMAIL" ? "card-badge-email" : "card-badge-social";
}

function hubColumnForScenario(s: ScenarioSummary): "mail" | "social" | "security" {
  if (s.requiredRole === "SECURITY_ADMIN") {
    return "security";
  }
  if (s.type === "SOCIAL") {
    return "social";
  }
  return "mail";
}

function firstOpenScenarioId(columns: {
  mail: ScenarioSummary[];
  social: ScenarioSummary[];
  security: ScenarioSummary[];
}): string | null {
  for (const list of [columns.mail, columns.social, columns.security]) {
    const s = list.find((x) => !x.locked);
    if (s) {
      return s.id;
    }
  }
  return null;
}

function ScenarioCard({ s }: { s: ScenarioSummary }) {
  return (
    <article className={`hub-scenario-card${s.locked ? " hub-scenario-card-locked" : ""}`}>
      <span className={`card-badge ${typeClass(s.type)}`}>{typeLabel(s.type)}</span>
      {s.locked ? (
        <span className="card-lock-hint">Нужна роль: {careerTitle(s.requiredRole)}</span>
      ) : null}
      <h3 className="hub-scenario-title">{s.title}</h3>
      <p className="hub-scenario-desc">{s.description}</p>
      {s.locked ? (
        <span className="btn btn-primary hub-scenario-btn-disabled" aria-disabled>
          Заблокировано
        </span>
      ) : (
        <Link
          to={`/play/${encodeURIComponent(s.id)}`}
          className="btn btn-primary hub-scenario-open"
        >
          Открыть
        </Link>
      )}
    </article>
  );
}

export function HomePage() {
  const [items, setItems] = useState<ScenarioSummary[] | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(() => {
    if (!items) {
      return { mail: [] as ScenarioSummary[], social: [] as ScenarioSummary[], security: [] as ScenarioSummary[] };
    }
    const mail: ScenarioSummary[] = [];
    const social: ScenarioSummary[] = [];
    const security: ScenarioSummary[] = [];
    for (const s of items) {
      const col = hubColumnForScenario(s);
      if (col === "mail") mail.push(s);
      else if (col === "social") social.push(s);
      else security.push(s);
    }
    return { mail, social, security };
  }, [items]);

  const quickStartId = useMemo(() => firstOpenScenarioId(columns), [columns]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, data] = await Promise.all([fetchPlayerState(), fetchScenarios()]);
        if (cancelled) {
          return;
        }
        setPlayer(p);
        setItems(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Не удалось загрузить данные");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingMail = columns.mail.filter((s) => !s.locked).length;
  const pendingSocial = columns.social.filter((s) => !s.locked).length;
  const pendingSec = columns.security.filter((s) => !s.locked).length;

  return (
    <div className="home-page">
      <section className="hero" aria-label="Вступление">
        <div className="hero-bg">
          <div className="hero-blob" />
        </div>
        <span className="hero-sticker hero-sticker-1" aria-hidden>
          💰
        </span>
        <span className="hero-sticker hero-sticker-2" aria-hidden>
          🚀
        </span>
        <span className="hero-sticker hero-sticker-3" aria-hidden>
          👛
        </span>
        <span className="hero-sticker hero-sticker-4" aria-hidden>
          🛡️
        </span>
        <div className="hero-content">
          <h1 className="hero-title">Защита данных без анкет</h1>
          <p className="hero-lead">
            Почта, лента и тикеты ИБ — действуйте в интерфейсах, похожих на рабочие. Репутация компании, роль и
            достижения растут вместе с навыком.
          </p>
          <div className="hero-cta">
            <a href="#workdesk" className="btn btn-primary">
              Рабочий стол
            </a>
            {quickStartId ? (
              <Link to={`/play/${encodeURIComponent(quickStartId)}`} className="btn btn-secondary">
                Быстрый старт
              </Link>
            ) : (
              <a href="#career" className="btn btn-secondary">
                Карьера
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="feature-split" aria-labelledby="feature-title">
        <div className="feature-split-media">
          <div className="app-preview">
            <div className="app-preview-phone">
              <div className="app-preview-notch" aria-hidden />
              <div className="app-preview-screen card-dark">
                <div className="app-preview-fake-chip">Симуляция</div>
                <div className="app-preview-fake-bar" />
                <h2 className="app-preview-fake-title">Guard Desk</h2>
                <p className="app-preview-fake-meta">Входящие · расследование · последствия</p>
                <div className="app-preview-fake-row" />
                <div className="app-preview-fake-row" />
                <div className="app-preview-fake-row" style={{ opacity: 0.65 }} />
              </div>
            </div>
          </div>
        </div>
        <div className="feature-split-copy">
          <h2 id="feature-title" className="display-h2">
            Не тест — интерфейс
          </h2>
          <p>
            Те же решения, что и в опроснике, но вы кликаете по ссылке, отправителю и вложениям. Вкладки осмотра и короткие
            сцены «что произошло» после ошибки держат в напряжении, как в реальном инциденте.
          </p>
          <a href="#workdesk" className="btn btn-primary btn-inline">
            К задачам
          </a>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {player ? (
        <section id="career" className="career-panel" aria-label="Карьера и репутация">
          <div className="career-panel-row">
            <div className="career-role-pill">
              <span className="career-role-label">Роль</span>
              <strong>{careerTitle(player.role)}</strong>
            </div>
            <div className="career-rep">
              <div className="career-rep-head">
                <span>Доверие клиентов</span>
                <strong>{player.reputation}%</strong>
              </div>
              <div className="career-rep-track" aria-hidden>
                <div className="career-rep-fill" style={{ width: `${player.reputation}%` }} />
              </div>
            </div>
            <div className="career-streak">
              <span className="career-streak-label">Идеальные сценарии подряд</span>
              <strong>{player.perfectScenarioStreak}</strong>
            </div>
          </div>
          <div className="achievements-block">
            <h2 className="achievements-title">Дневник достижений</h2>
            <ul className="achievements-list">
              {player.achievements.map((a) => (
                <li key={a.id} className={a.unlocked ? "ach-unlocked" : "ach-locked"}>
                  <span className="ach-icon" aria-hidden>
                    {a.unlocked ? "✓" : "○"}
                  </span>
                  <div>
                    <div className="ach-name">{a.title}</div>
                    <div className="ach-desc">{a.description}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      {items === null && !error ? <div className="skeleton" aria-busy /> : null}
      {items ? (
        <>
          <h2 className="section-heading" id="workdesk">
            Рабочий стол
          </h2>
          <p className="page-subtitle" style={{ marginTop: 0 }}>
            Откройте канал: почту, ленту или тикет безопасности.
          </p>
          <div className="desk-hub" aria-label="Рабочий стол">
            <div className="desk-hub-monitor">
              <section className="desk-app desk-app-mail" aria-label="Почта">
                <header className="desk-app-header">
                  <span className="desk-app-icon" aria-hidden>
                    ✉
                  </span>
                  <h3 className="desk-app-title">Почта</h3>
                  {pendingMail > 0 ? (
                    <span className="desk-app-badge">
                      {pendingMail} {pendingMail === 1 ? "задача" : "задачи"}
                    </span>
                  ) : null}
                </header>
                <p className="desk-app-blurb">Фишинг и подозрительные вложения — как в настоящем ящике.</p>
                <div className="desk-app-stack">
                  {columns.mail.map((s) => (
                    <ScenarioCard key={s.id} s={s} />
                  ))}
                </div>
              </section>
              <section className="desk-app desk-app-social" aria-label="Соцсеть">
                <header className="desk-app-header">
                  <span className="desk-app-icon" aria-hidden>
                    ◉
                  </span>
                  <h3 className="desk-app-title">Лента</h3>
                  {pendingSocial > 0 ? <span className="desk-app-badge">{pendingSocial}</span> : null}
                </header>
                <p className="desk-app-blurb">Ложные розыгрыши и кража логинов в ленте.</p>
                <div className="desk-app-stack">
                  {columns.social.map((s) => (
                    <ScenarioCard key={s.id} s={s} />
                  ))}
                </div>
              </section>
              <section className="desk-app desk-app-security" aria-label="Задачи ИБ">
                <header className="desk-app-header">
                  <span className="desk-app-icon" aria-hidden>
                    🛡
                  </span>
                  <h3 className="desk-app-title">ИБ</h3>
                  {pendingSec > 0 ? <span className="desk-app-badge">{pendingSec}</span> : null}
                </header>
                <p className="desk-app-blurb">Цепочки атак для администратора безопасности.</p>
                <div className="desk-app-stack">
                  {columns.security.map((s) => (
                    <ScenarioCard key={s.id} s={s} />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
