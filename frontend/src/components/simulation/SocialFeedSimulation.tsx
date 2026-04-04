import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { stepAnalysisText } from "../../missionText";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { mockSavedPosts, mockSocialFriends } from "./simMockData";

function SkeletonCard(props: { variant: "top" | "bottom"; onOpenDetail: () => void }) {
  return (
    <button
      type="button"
      className="sim-fb-card sim-fb-skeleton sim-fb-skeleton-interactive"
      aria-label="Заглушка поста в ленте"
      onClick={props.onOpenDetail}
    >
      <div className="sim-fb-skeleton-head">
        <span className="sim-fb-skeleton-avatar" />
        <div className="sim-fb-skeleton-lines">
          <span className="sim-fb-skeleton-line sim-fb-skeleton-line-short" />
          <span className="sim-fb-skeleton-line sim-fb-skeleton-line-meta" />
        </div>
      </div>
      <div className="sim-fb-skeleton-body">
        <span className="sim-fb-skeleton-line" />
        <span className="sim-fb-skeleton-line" />
        <span className="sim-fb-skeleton-line sim-fb-skeleton-line-medium" />
      </div>
      <span className="sim-fb-skeleton-hint">Нажмите, чтобы открыть заглушку</span>
    </button>
  );
}

function navStripMessage(key: "home" | "friends" | "watch" | "grid" | "menu"): string {
  const map: Record<typeof key, string> = {
    home: "",
    friends: "Раздел «Друзья»: заявок нет. Активное задание — в карточке ниже.",
    watch: "Раздел «Видео»: рекомендации выключены в симуляции. Задание — в ленте ниже.",
    grid: "Раздел «Меню»: сетка ярлыков. Учебный пост с ответами — ниже.",
    menu: "Меню аккаунта: здесь только навигация. Ответ по заданию — кнопки в карточке поста.",
  };
  return map[key] ?? "";
}

export function SocialFeedSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, childrenFooter, splitLayout = false } = props;
  const analysisText = stepAnalysisText(step);
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;

  const [search, setSearch] = useState("");
  const [navKey, setNavKey] = useState<"home" | "friends" | "watch" | "grid" | "menu">("home");
  const [sidebarKey, setSidebarKey] = useState<"feed" | "friends" | "saved">("feed");
  const [skeletonPanel, setSkeletonPanel] = useState<null | "top" | "bottom">(null);
  const [liked, setLiked] = useState(false);
  const [baseLikes, setBaseLikes] = useState(12);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const [simToast, setSimToast] = useState<string | null>(null);

  const searchQ = search.trim().toLowerCase();
  const narrativeHit = useMemo(() => {
    if (!searchQ) {
      return true;
    }
    return analysisText.toLowerCase().includes(searchQ) || "неизвестная страница".includes(searchQ);
  }, [searchQ, analysisText]);

  useEffect(() => {
    setSearch("");
    setNavKey("home");
    setSidebarKey("feed");
    setSkeletonPanel(null);
    setLiked(false);
    setCommentOpen(false);
    setCommentDraft("");
    setFollowed({});
    setSimToast(null);
    let h = 0;
    for (let i = 0; i < step.id.length; i++) {
      h = (h * 31 + step.id.charCodeAt(i)) | 0;
    }
    setBaseLikes(8 + (Math.abs(h) % 42));
  }, [step.id]);

  useEffect(() => {
    if (!simToast) {
      return;
    }
    const t = window.setTimeout(() => setSimToast(null), 2400);
    return () => clearTimeout(t);
  }, [simToast]);

  const friendsMock = useMemo(() => mockSocialFriends(step.id), [step.id]);
  const savedMock = useMemo(() => mockSavedPosts(step.id), [step.id]);

  const stripNav = navStripMessage(navKey);
  const stripSidebar =
    sidebarKey === "feed"
      ? ""
      : sidebarKey === "friends"
        ? "Контакты: условие задания — в карточке поста ниже."
        : "Сохранённое: нажмите запись — краткая подсказка внизу.";

  return (
    <div className="ui-frame ui-frame-social sim-fb-root sim-social-layout">
      {simToast ? <div className="sim-mini-toast">{simToast}</div> : null}
      {skeletonPanel ? (
        <>
          <button
            type="button"
            className="sim-sim-backdrop"
            aria-label="Закрыть"
            onClick={() => setSkeletonPanel(null)}
          />
          <div className="sim-fb-skeleton-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 className="sim-fb-skeleton-panel-title">Заглушка поста</h3>
            <p className="sim-fb-skeleton-panel-text">
              В демонстрационной ленте только одна настоящая карточка с заданием. Этот блок имитирует бесконечную ленту —
              прокрутка и лайки здесь не ведут к новым сценариям.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setSkeletonPanel(null)}>
              Закрыть
            </button>
          </div>
        </>
      ) : null}

      {commentOpen ? (
        <>
          <button type="button" className="sim-sim-backdrop" aria-label="Закрыть" onClick={() => setCommentOpen(false)} />
          <div className="sim-fb-comment-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 className="sim-fb-skeleton-panel-title">Комментарий</h3>
            <p className="sim-fb-skeleton-panel-text">
              Текст ниже не отправляется на сервер и не влияет на оценку — только тренировка привычки не кликать под
              давлением.
            </p>
            <textarea
              className="sim-fb-comment-textarea"
              rows={4}
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Напишите мысль…"
            />
            <div className="sim-fb-comment-actions">
              <button type="button" className="btn" onClick={() => setCommentOpen(false)}>
                Отмена
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setSimToast("В учебной ленте публикация отключена — текст остаётся только в этой форме.");
                }}
              >
                Опубликовать
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setCommentOpen(false);
                  setSimToast(commentDraft.trim() ? "Черновик комментария сохранён локально." : "Пустой комментарий закрыт.");
                }}
              >
                Готово
              </button>
            </div>
          </div>
        </>
      ) : null}

      <header className="sim-fb-topbar">
        <div className="sim-fb-topbar-inner">
          <div className="sim-fb-brand">
            <span className="sim-fb-logo" aria-hidden>
              f
            </span>
          </div>
          <div className="sim-fb-search-wrap">
            <span className="sim-fb-search-icon" aria-hidden>
              🔍
            </span>
            <input
              className="sim-fb-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск в сети"
              aria-label="Поиск (учебная симуляция, фильтрует текст поста локально)"
            />
          </div>
          <nav className="sim-fb-nav" aria-label="Разделы (симуляция)">
            {(
              [
                ["home", "⌂"],
                ["friends", "👥"],
                ["watch", "▶"],
                ["grid", "⧉"],
                ["menu", "☰"],
              ] as const
            ).map(([key, icon]) => (
              <button
                key={key}
                type="button"
                className={navKey === key ? "sim-fb-nav-btn sim-fb-nav-btn-active" : "sim-fb-nav-btn"}
                aria-pressed={navKey === key}
                onClick={() => setNavKey(key)}
              >
                {icon}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="sim-fb-page">
        <aside className="sim-fb-sidebar" aria-label="Ярлыки">
          <button
            type="button"
            className={sidebarKey === "feed" ? "sim-fb-shortcut sim-fb-shortcut-active" : "sim-fb-shortcut"}
            onClick={() => setSidebarKey("feed")}
          >
            Главная
          </button>
          <button
            type="button"
            className={sidebarKey === "friends" ? "sim-fb-shortcut sim-fb-shortcut-active" : "sim-fb-shortcut"}
            onClick={() => setSidebarKey("friends")}
          >
            Друзья
          </button>
          <button
            type="button"
            className={sidebarKey === "saved" ? "sim-fb-shortcut sim-fb-shortcut-active" : "sim-fb-shortcut"}
            onClick={() => setSidebarKey("saved")}
          >
            Сохранённое
          </button>
        </aside>

        <div className="sim-fb-feed-col">
          {stripNav ? <p className="sim-fb-context-strip">{stripNav}</p> : null}
          {stripSidebar ? <p className="sim-fb-context-strip sim-fb-context-strip--sidebar">{stripSidebar}</p> : null}
          {!narrativeHit && searchQ ? (
            <p className="sim-fb-search-miss" role="status">
              По запросу «{search.trim()}» в тексте поста совпадений нет — условие может быть в панели слева (режим
              раздельного экрана).
            </p>
          ) : null}

          {navKey === "friends" ? (
            <div className="sim-fb-friends-list" aria-label="Друзья и подписки">
              {friendsMock.map((f) => (
                <div key={f.id} className="sim-fb-friend-row">
                  <div>
                    <div className="sim-fb-friend-name">{f.name}</div>
                    <div className="sim-fb-friend-sub">{f.subtitle}</div>
                  </div>
                  <button
                    type="button"
                    className={followed[f.id] ? "sim-fb-follow sim-fb-follow--on" : "sim-fb-follow"}
                    onClick={() => {
                      setFollowed((prev) => {
                        const next = !prev[f.id];
                        setSimToast(next ? `Вы подписались на «${f.name}»` : `Вы отписались от «${f.name}»`);
                        return { ...prev, [f.id]: next };
                      });
                    }}
                  >
                    {followed[f.id] ? "Отписаться" : "Подписаться"}
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {navKey === "watch" ? (
            <div className="sim-fb-placeholder-block sim-fb-placeholder-block--watch">
              <button
                type="button"
                className="sim-fb-fake-video-play"
                onClick={() => setSimToast("Воспроизведение недоступно — учебный ролик-заглушка.")}
              >
                <div className="sim-fb-fake-video" />
                <span className="sim-fb-fake-video-play-ico" aria-hidden>
                  ▶
                </span>
              </button>
              <p>Нажмите на превью — воспроизведение в симуляции недоступно.</p>
            </div>
          ) : null}
          {navKey === "grid" ? (
            <div className="sim-fb-placeholder-grid" aria-label="Ярлыки приложений">
              {Array.from({ length: 6 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="sim-fb-placeholder-tile"
                  onClick={() => setSimToast(`Ярлык ${i + 1}: демонстрационный раздел`)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          ) : null}
          {navKey === "menu" ? (
            <div className="sim-fb-account-menu">
              <button type="button" className="sim-fb-account-item" onClick={() => setNavKey("home")}>
                Вернуться к ленте
              </button>
              <button type="button" className="sim-fb-account-item" onClick={() => setSidebarKey("feed")}>
                Показать главную в ярлыках
              </button>
              <button type="button" className="sim-fb-account-item" onClick={() => setSearch("рекомендации")}>
                Заполнить поиск примером
              </button>
            </div>
          ) : null}

          {sidebarKey === "saved" ? (
            <ul className="sim-fb-saved-list" aria-label="Сохранённые записи">
              {savedMock.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="sim-fb-saved-item"
                    onClick={() => setSimToast(`Открыто: ${p.title}`)}
                  >
                    <span className="sim-fb-saved-title">{p.title}</span>
                    <span className="sim-fb-saved-meta">{p.meta}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <SkeletonCard variant="top" onOpenDetail={() => setSkeletonPanel("top")} />

          <div className="social-card sim-social-card sim-fb-card sim-fb-card-main">
            <div className="sim-social-card-head">
              <div className="sim-social-avatar" aria-hidden>
                ?
              </div>
              <div>
                <div className="sim-social-author">Неизвестная страница</div>
                <div className="social-card-meta">Рекомендации · сейчас</div>
              </div>
            </div>
            {splitLayout ? (
              <p className="sim-split-hint sim-social-split-hint">Текст поста — в панели «Условие» слева.</p>
            ) : (
              <div className="narrative-frame sim-social-body">
                {searchQ && narrativeHit
                  ? analysisText.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")).map((part, i) =>
                      part.toLowerCase() === searchQ ? (
                        <mark key={i} className="sim-fb-search-mark">
                          {part}
                        </mark>
                      ) : (
                        <span key={i}>{part}</span>
                      ),
                    )
                  : analysisText}
              </div>
            )}
            {noise}
            <div className="sim-fb-light-actions" role="group" aria-label="Реакции (симуляция)">
              <button
                type="button"
                className={liked ? "sim-fb-like-btn sim-fb-like-btn--on" : "sim-fb-like-btn"}
                title="Лайк не влияет на оценку — только имитация ленты"
                onClick={() => setLiked((v) => !v)}
              >
                <span className="sim-fb-like-ico" aria-hidden>
                  {liked ? "♥" : "♡"}
                </span>
                <span>Нравится</span>
              </button>
              <span className="sim-fb-like-meta" title="Случайное число для атмосферы">
                {baseLikes + (liked ? 1 : 0)}
              </span>
              <button
                type="button"
                className="sim-fb-comment-btn"
                title="Написать комментарий (локально)"
                onClick={() => setCommentOpen(true)}
              >
                Комментировать
              </button>
            </div>
            {step.hotspots.length > 0 ? (
              <div className="sim-social-actions sim-fb-post-actions" role="group">
                {step.hotspots.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={`sim-social-action-btn sim-fb-action-btn hotspot-variant-${h.variant.toLowerCase()}`}
                    disabled={disabled}
                    onClick={() => onChoose(h.choiceId)}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <SkeletonCard variant="bottom" onOpenDetail={() => setSkeletonPanel("bottom")} />
        </div>
      </div>
      {childrenFooter}
    </div>
  );
}
