import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { stepAnalysisText } from "../../missionText";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { mockFeedDecorPosts, mockSavedPosts, mockSocialFriends, type MockFeedDecorPost } from "./simMockData";

function MockFeedDecorCard(props: { post: MockFeedDecorPost; onOpen: () => void }) {
  return (
    <button type="button" className="sim-fb-card sim-fb-mock-post" aria-label={`Пост: ${props.post.author}`} onClick={props.onOpen}>
      <div className="sim-social-card-head sim-fb-mock-post-head">
        <div className="sim-social-avatar sim-fb-mock-avatar" aria-hidden>
          {props.post.initials}
        </div>
        <div>
          <div className="sim-social-author">{props.post.author}</div>
          <div className="social-card-meta">{props.post.timeMeta}</div>
        </div>
      </div>
      <p className="sim-fb-mock-snippet">{props.post.preview}</p>
    </button>
  );
}

function navStripMessage(key: "home" | "friends" | "watch" | "grid" | "menu"): string {
  const map: Record<typeof key, string> = {
    home: "",
    friends: "Здесь список контактов. Пост с заданием — в основной ленте ниже.",
    watch: "В этом разделе нет роликов с заданием. Вернитесь на главную ленту — там карточка с текстом и ответами.",
    grid: "Ярлыки приложений. Пост, по которому нужно ответить, — в ленте ниже.",
    menu: "Пункты меню только для навигации. Выбор ответа — кнопки под постом с заданием.",
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
  const [decorDialogPost, setDecorDialogPost] = useState<MockFeedDecorPost | null>(null);
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
    return analysisText.toLowerCase().includes(searchQ);
  }, [searchQ, analysisText]);

  useEffect(() => {
    setSearch("");
    setNavKey("home");
    setSidebarKey("feed");
    setDecorDialogPost(null);
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
  const [decorTop, decorBottom] = useMemo(() => mockFeedDecorPosts(step.id), [step.id]);

  const stripNav = navStripMessage(navKey);
  const stripSidebar =
    sidebarKey === "feed"
      ? ""
      : sidebarKey === "friends"
        ? "Список друзей. Текст задания — в карточке поста в ленте."
        : "Сохранённые записи: нажмите строку, чтобы увидеть подсказку.";

  return (
    <div className="ui-frame ui-frame-social sim-fb-root sim-social-layout">
      {simToast ? <div className="sim-mini-toast">{simToast}</div> : null}
      {decorDialogPost ? (
        <>
          <button
            type="button"
            className="sim-sim-backdrop"
            aria-label="Закрыть"
            onClick={() => setDecorDialogPost(null)}
          />
          <div className="sim-fb-skeleton-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 className="sim-fb-skeleton-panel-title">{decorDialogPost.dialogTitle}</h3>
            <p className="sim-fb-skeleton-panel-text">{decorDialogPost.dialogBody}</p>
            <button type="button" className="btn btn-primary" onClick={() => setDecorDialogPost(null)}>
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
              Комментарий остаётся в этом окне и не отправляется никуда. На баллы влияет только выбор из кнопок под постом
              с заданием.
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
                  setSimToast("Публикация отключена — текст остаётся только в этой форме.");
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

      <header className="sim-fb-topbar sim-app-bar">
        <div className="sim-fb-topbar-inner sim-app-bar-inner">
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
              aria-label="Поиск по тексту поста в ленте"
            />
          </div>
          <nav className="sim-fb-nav" aria-label="Разделы ленты">
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
                className={
                  navKey === key ? "app-nav-pill app-nav-pill--icon app-nav-pill--active" : "app-nav-pill app-nav-pill--icon"
                }
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
            className={
              sidebarKey === "feed"
                ? "app-nav-pill app-nav-pill--natural app-nav-pill--stretch app-nav-pill--active"
                : "app-nav-pill app-nav-pill--natural app-nav-pill--stretch"
            }
            onClick={() => setSidebarKey("feed")}
          >
            Главная
          </button>
          <button
            type="button"
            className={
              sidebarKey === "friends"
                ? "app-nav-pill app-nav-pill--natural app-nav-pill--stretch app-nav-pill--active"
                : "app-nav-pill app-nav-pill--natural app-nav-pill--stretch"
            }
            onClick={() => setSidebarKey("friends")}
          >
            Друзья
          </button>
          <button
            type="button"
            className={
              sidebarKey === "saved"
                ? "app-nav-pill app-nav-pill--natural app-nav-pill--stretch app-nav-pill--active"
                : "app-nav-pill app-nav-pill--natural app-nav-pill--stretch"
            }
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
              По запросу «{search.trim()}» в тексте поста совпадений нет. Откройте раздел «Условие», если ищете формулировку
              задания.
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
                onClick={() => setSimToast("Воспроизведение недоступно — это превью для интерфейса.")}
              >
                <div className="sim-fb-fake-video" />
                <span className="sim-fb-fake-video-play-ico" aria-hidden>
                  ▶
                </span>
              </button>
              <p>Нажмите на превью — видео здесь не запускается.</p>
            </div>
          ) : null}
          {navKey === "grid" ? (
            <div className="sim-fb-placeholder-grid" aria-label="Ярлыки приложений">
              {Array.from({ length: 6 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="sim-fb-placeholder-tile"
                  onClick={() => setSimToast(`Раздел «${i + 1}» — только интерфейс, без задания.`)}
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

          <MockFeedDecorCard post={decorTop} onOpen={() => setDecorDialogPost(decorTop)} />

          <div className="social-card sim-social-card sim-fb-card sim-fb-card-main">
            <div className="sim-social-card-head">
              <div className="sim-social-avatar" aria-hidden>
                П
              </div>
              <div>
                <div className="sim-social-author">Подборка для вас</div>
                <div className="social-card-meta">Лента · сейчас</div>
              </div>
            </div>
            {splitLayout ? (
              <p className="sim-split-hint sim-social-split-hint">
                Текст поста — в разделе «Условие» (кнопка «К условию» вверху).
              </p>
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
            <div className="sim-fb-light-actions" role="group" aria-label="Реакции">
              <button
                type="button"
                className={liked ? "sim-fb-like-btn sim-fb-like-btn--on" : "sim-fb-like-btn"}
                title="Лайк только для вида ленты, на оценку не влияет"
                onClick={() => setLiked((v) => !v)}
              >
                <span className="sim-fb-like-ico" aria-hidden>
                  {liked ? "♥" : "♡"}
                </span>
                <span>Нравится</span>
              </button>
              <span className="sim-fb-like-meta" title="Число как в соцсетях, без влияния на задание">
                {baseLikes + (liked ? 1 : 0)}
              </span>
              <button
                type="button"
                className="sim-fb-comment-btn"
                title="Открыть форму комментария"
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

          <MockFeedDecorCard post={decorBottom} onOpen={() => setDecorDialogPost(decorBottom)} />
        </div>
      </div>
      {childrenFooter}
    </div>
  );
}
