import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchPlayerState, fetchScenarios } from "../api";
import { canUseAppRoutes } from "../demoMode";
import { navigateToGuestDashboard } from "../guestDemoNav";
import { useUserMe } from "../hooks/useUserMe";
import { loginHref } from "../navigationConstants";
import { firstOpenScenarioId, splitScenariosByColumn } from "../scenarioHub";
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

export function HomePage() {
  const navigate = useNavigate();
  const { me } = useUserMe();
  const [items, setItems] = useState<ScenarioSummary[] | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const appUnlocked = canUseAppRoutes(me);
  const dashHref = appUnlocked ? "/dashboard" : loginHref("/dashboard");

  const columns = useMemo(() => {
    if (!items) {
      return { mail: [] as ScenarioSummary[], social: [] as ScenarioSummary[], security: [] as ScenarioSummary[] };
    }
    return splitScenariosByColumn(items);
  }, [items]);

  const quickStartId = useMemo(() => firstOpenScenarioId(columns), [columns]);

  useEffect(() => {
    if (!appUnlocked) {
      setPlayer(null);
      setItems(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [p, data] = await Promise.all([fetchPlayerState(), fetchScenarios()]);
        if (cancelled) {
          return;
        }
        setPlayer(p);
        setItems(data);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Не удалось загрузить данные");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appUnlocked]);

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
            Почта, лента и тикеты — в интерфейсах, похожих на рабочие. Опыт, уровень и репутация растут вместе с навыком,
            без сухого теста.
          </p>
          <div className="hero-cta">
            <Link to={dashHref} className="btn btn-primary">
              Начать
            </Link>
            <button
              type="button"
              className="btn btn-secondary home-demo-btn"
              onClick={() => navigateToGuestDashboard(navigate)}
            >
              Демо
            </button>
            {quickStartId ? (
              <Link to={`/play/${encodeURIComponent(quickStartId)}`} className="btn btn-secondary">
                Быстрый старт
              </Link>
            ) : null}
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
          <Link to={dashHref} className="btn btn-primary">
            К задачам и достижениям
          </Link>
          {quickStartId ? (
            <Link to={`/play/${encodeURIComponent(quickStartId)}`} className="btn btn-secondary">
              Сразу в сценарий
            </Link>
          ) : null}
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {appUnlocked && items === null && !error ? <div className="skeleton" aria-busy /> : null}
      {player && items ? (
        <p className="home-mini-hint">
          Данные игрока загружены. Откройте{" "}
          <Link to={dashHref} className="home-mini-hint-link">
            дашборд
          </Link>
          , чтобы увидеть уровень, бейджи и задачи.
        </p>
      ) : null}
    </div>
  );
}
