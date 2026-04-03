import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPlayerState, fetchScenarios } from "../api";
import { careerTitle } from "../careerLabels";
import type { PlayerState, ScenarioSummary } from "../types";

const SLIDER_SLIDES = [
  {
    icon: "⛔",
    title: "Подозрительные ссылки",
    body: "Сравнение URL и внимание к домену — как перед реальным переходом в браузере.",
  },
  {
    icon: "✉️",
    title: "Фишинг во входящих",
    body: "Письма с тем же напряжением, что и на работе: отправитель, вложения, срочность.",
  },
  {
    icon: "◉",
    title: "Лента и ложные призы",
    body: "Посты и кнопки действий — отмечайте манипуляции до ввода пароля.",
  },
] as const;

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
  const [slideIndex, setSlideIndex] = useState(0);

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

  const slide = SLIDER_SLIDES[slideIndex] ?? SLIDER_SLIDES[0];
  const slideNext = () => setSlideIndex((i) => (i + 1) % SLIDER_SLIDES.length);
  const slidePrev = () => setSlideIndex((i) => (i - 1 + SLIDER_SLIDES.length) % SLIDER_SLIDES.length);

  return (
    <div className="home-page">
      <section className="hero hero-bento" aria-label="Вступление">
        <span className="hero-sticker hero-sticker-1" aria-hidden>
          🔑
        </span>
        <span className="hero-sticker hero-sticker-2" aria-hidden>
          ✓
        </span>
        <span className="hero-sticker hero-sticker-3" aria-hidden>
          🔒
        </span>
        <span className="hero-sticker hero-sticker-4" aria-hidden>
          🛡️
        </span>
        <div className="hero-content">
          <h1 className="hero-bento-title">Защита. Фокус. Контроль.</h1>
          <p className="hero-lead">
            Почта, лента и тикеты — в интерфейсах, похожих на рабочие. Репутация и роль растут вместе с навыком, без
            сухого теста.
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

      <section className="bento-features" aria-labelledby="bento-features-title">
        <h2 id="bento-features-title" className="bento-section-title">
          Почему это не анкета
        </h2>
        <div className="bento-grid">
          <div className="bento-cell bento-cell--orange">
            <span className="bento-cell-kicker">Интерфейс</span>
            <h3>Всё в вашем экране</h3>
            <p>Клики по ссылке, отправителю и вложениям — как в настоящем клиенте, а не выбор из списка формулировок.</p>
          </div>
          <div className="bento-cell bento-cell--white">
            <div className="bento-illus">
              <div className="bento-illus-row">
                <div className="bento-illus-circle" aria-hidden>
                  🔒
                </div>
                <div className="bento-illus-circle" style={{ background: "#fff5" }} aria-hidden>
                  👤
                </div>
              </div>
            </div>
          </div>

          <div className="bento-cell bento-cell--white">
            <div className="bento-illus">
              <div className="bento-illus-phone" aria-hidden>
                ✓
              </div>
            </div>
          </div>
          <div className="bento-cell bento-cell--yellow">
            <span className="bento-cell-kicker">Контекст</span>
            <h3>Решения в сцене</h3>
            <p>Таймер, шум в письме и вкладки расследования — давление ближе к реальному дню, без токсичности.</p>
          </div>

          <div className="bento-cell bento-cell--mint">
            <span className="bento-cell-kicker">Рабочий день</span>
            <h3>Связка каналов</h3>
            <p>Почта, соцсеть и тикет ИБ в одном стиле — от стажёра до администратора безопасности.</p>
          </div>
          <div className="bento-cell bento-cell--white">
            <div className="bento-illus">
              <span className="bento-illus-input" aria-hidden>
                ••••••••
              </span>
            </div>
          </div>

          <div className="bento-cell bento-cell--white">
            <div className="bento-illus">
              <div className="bento-illus-shield" aria-hidden>
                🛡️
              </div>
            </div>
          </div>
          <div className="bento-cell bento-cell--lilac">
            <span className="bento-cell-kicker">Рост</span>
            <h3>Защита на вырост</h3>
            <p>Репутация компании и цепочка достижений — мотивация возвращаться и закрывать сценарии без ошибок.</p>
          </div>
        </div>
      </section>

      <section className="bento-dark-band" aria-label="Акцент">
        <p>Сделаем осторожность привычкой — прямо в симуляции</p>
      </section>

      <div className="bento-slider-wrap">
        <div className="bento-slider" aria-roledescription="карусель">
          <div className="bento-slider-inner">
            <div className="bento-slider-icon" aria-hidden>
              {slide.icon}
            </div>
            <h3>{slide.title}</h3>
            <p>{slide.body}</p>
            <div className="bento-slider-controls">
              <button type="button" className="bento-slider-arrow" aria-label="Предыдущий слайд" onClick={slidePrev}>
                ←
              </button>
              <div className="bento-slider-dots" role="tablist" aria-label="Слайды">
                {SLIDER_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === slideIndex}
                    className={`bento-slider-dot${i === slideIndex ? " bento-slider-dot--active" : ""}`}
                    aria-label={`Слайд ${i + 1}`}
                    onClick={() => setSlideIndex(i)}
                  />
                ))}
              </div>
              <button type="button" className="bento-slider-arrow" aria-label="Следующий слайд" onClick={slideNext}>
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="bento-cta" aria-labelledby="bento-cta-title">
        <h2 id="bento-cta-title">Ваши данные. Ваши решения. Ваша репутация.</h2>
        <div className="bento-cta-row">
          <a href="#workdesk" className="btn btn-primary">
            К задачам
          </a>
          {quickStartId ? (
            <Link to={`/play/${encodeURIComponent(quickStartId)}`} className="btn btn-secondary">
              Сразу в сценарий
            </Link>
          ) : null}
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
