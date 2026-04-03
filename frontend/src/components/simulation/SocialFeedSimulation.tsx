import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";

function SkeletonCard(props: { onActivate?: () => void }) {
  return (
    <button
      type="button"
      className="sim-fb-card sim-fb-skeleton sim-fb-skeleton-interactive"
      aria-label="Заглушка поста в ленте"
      onClick={props.onActivate}
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
    </button>
  );
}

export function SocialFeedSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, childrenFooter, splitLayout = false } = props;
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;

  const [search, setSearch] = useState("");
  const [navKey, setNavKey] = useState<"home" | "friends" | "watch" | "grid" | "menu">("home");
  const [sidebarKey, setSidebarKey] = useState<"feed" | "friends" | "saved">("feed");
  const [skeletonToast, setSkeletonToast] = useState(false);

  useEffect(() => {
    setSearch("");
    setNavKey("home");
    setSidebarKey("feed");
    setSkeletonToast(false);
  }, [step.id]);

  return (
    <div className="ui-frame ui-frame-social sim-fb-root sim-social-layout">
      {skeletonToast ? (
        <div className="sim-interactive-toast sim-fb-toast" role="status">
          <p>В демонстрационной ленте только один активный пост с заданием.</p>
          <button type="button" className="btn btn-primary" onClick={() => setSkeletonToast(false)}>
            Ок
          </button>
        </div>
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
              aria-label="Поиск (учебная симуляция, без запроса на сервер)"
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
          <SkeletonCard onActivate={() => setSkeletonToast(true)} />

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
              <div className="narrative-frame sim-social-body">{step.narrative}</div>
            )}
            {noise}
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

          <SkeletonCard onActivate={() => setSkeletonToast(true)} />
        </div>
      </div>
      {childrenFooter}
    </div>
  );
}
