import type { CSSProperties, ReactNode } from "react";

/** Безопасный суффикс класса из id награды (как в AchievementCatalog на бэкенде). */
export function achievementBadgeSlug(id: string): string {
  const s = id.replace(/[^a-z0-9-]/g, "");
  return s.length > 0 ? s : "unknown";
}

function SvgRoot(props: { children: ReactNode; title?: string }) {
  const { children, title } = props;
  return (
    <svg className="achievement-badge__svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

function BadgeGraphic({ id }: { id: string }) {
  switch (id) {
    case "first-phishing-spotless":
      return (
        <SvgRoot title="Фишинг">
          <path
            d="M8 14h24v14H8V14zm2 2v10h20V16H10zm4-6l6 3 6-3v2l-6 3-6-3v-2z"
            fill="currentColor"
            fillOpacity="0.92"
          />
          <path
            d="M20 22c-1.5 0-2.5 1-2.5 2.5S18.5 27 20 27s2.5-1 2.5-2.5S21.5 22 20 22zm0-1.5a4 4 0 014 4h-8a4 4 0 014-4z"
            fill="currentColor"
            fillOpacity="0.55"
          />
          <path d="M22 8v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
          <path d="M20 10l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
        </SvgRoot>
      );
    case "zero-leak-week":
      return (
        <SvgRoot title="Неделя без утечек">
          <path
            d="M20 6l12 6v10c0 6.5-5.2 11.8-12 12-6.8-.2-12-5.5-12-12V12l12-6z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.15"
          />
          <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="800" fill="currentColor" fontFamily="system-ui, sans-serif">
            7
          </text>
        </SvgRoot>
      );
    case "ten-perfect-row":
      return (
        <SvgRoot title="10 идеальных">
          <path d="M6 28l6-14 5 8 5-11 8 17H6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12" />
          <path
            d="M10 14l2 4 4-8 3 6 5-10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fillOpacity="0"
          />
          <text x="14" y="13" fontSize="9" fontWeight="900" fill="currentColor" fontFamily="system-ui, sans-serif">
            10
          </text>
        </SvgRoot>
      );
    case "challenge-track-inbox":
      return (
        <SvgRoot title="Входящие">
          <rect x="6" y="10" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
          <path d="M6 16h28l-8 8H14l-8-8z" fill="currentColor" fillOpacity="0.35" />
          <path d="M8 14h24" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" />
        </SvgRoot>
      );
    case "challenge-track-social":
      return (
        <SvgRoot title="Соцсети">
          <circle cx="14" cy="16" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
          <circle cx="26" cy="14" r="3.8" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.15" />
          <circle cx="24" cy="26" r="5" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.12" />
          <path d="M17.5 18.5c2 2 5 1 7-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
          <path d="M22 19c1.5 3 4 4 6 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.5" />
        </SvgRoot>
      );
    case "challenge-track-soc":
      return (
        <SvgRoot title="ИБ инциденты">
          <rect x="8" y="10" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.08" />
          <path d="M11 14h18M11 18h12M11 22h15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          <path
            d="M26 8v4M24 10h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="28" cy="9" r="2.5" fill="currentColor" fillOpacity="0.85" />
        </SvgRoot>
      );
    case "challenge-track-consumer":
      return (
        <SvgRoot title="Быт и учётки">
          <rect x="12" y="8" width="16" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.06" />
          <rect x="15" y="12" width="10" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
          <circle cx="20" cy="28" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </SvgRoot>
      );
    case "challenge-track-smokescreen":
      return (
        <SvgRoot title="Шум и vishing">
          <rect x="7" y="11" width="26" height="18" rx="3" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.07" />
          <path d="M11 16h14M11 20h18M11 24h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.55" />
          <path d="M28 7c2 2 2 5 0 7M31 5c3 3 3 8 0 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.45" />
        </SvgRoot>
      );
    case "challenge-track-malware-endpoints":
      return (
        <SvgRoot title="Вредоносы">
          <rect x="9" y="9" width="22" height="22" rx="2" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.06" />
          <path d="M14 14h12v8H14v-8zm3-3v3M23 11v3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
          <ellipse cx="20" cy="18" rx="3" ry="4" fill="currentColor" fillOpacity="0.35" />
          <path d="M17 17l-2-2M23 17l2-2M18 21l-1 3M22 21l1 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </SvgRoot>
      );
    case "challenge-track-search-perimeter":
      return (
        <SvgRoot title="Поиск и периметр">
          <circle cx="18" cy="18" r="7" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
          <path d="M24 24l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 28V12h24v16" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" strokeOpacity="0.4" />
        </SvgRoot>
      );
    case "challenge-track-benign":
      return (
        <SvgRoot title="Без угрозы">
          <path
            d="M20 7l11 5v9c0 5.5-4.5 10-11 11-6.5-1-11-5.5-11-11v-9l11-5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <path d="M15 20l3 3 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </SvgRoot>
      );
    case "trust-80":
      return (
        <SvgRoot title="Доверие 80%">
          <path d="M8 28a12 12 0 0124 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeOpacity="0.35" />
          <path d="M8 28A12 12 0 0120 16v12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <text x="26" y="26" fontSize="8" fontWeight="800" fill="currentColor" fontFamily="system-ui, sans-serif">
            80
          </text>
        </SvgRoot>
      );
    case "trust-95":
      return (
        <SvgRoot title="Доверие 95%">
          <path d="M12 14l4 3 8-6 4 5v10H12V14z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12" />
          <path d="M20 10l1.5 3.5 3.5.5-2.5 2.5.8 3.5L20 18l-3.3 2 .8-3.5-2.5-2.5 3.5-.5L20 10z" fill="currentColor" fillOpacity="0.9" />
          <text x="14" y="30" fontSize="7" fontWeight="800" fill="currentColor" fontFamily="system-ui, sans-serif">
            95%
          </text>
        </SvgRoot>
      );
    default:
      return (
        <SvgRoot title="Награда">
          <path
            d="M20 6l3.5 7 7.8 1.1-5.6 5.5 1.3 7.8L20 24.9l-7 4.5 1.3-7.8-5.6-5.5 7.8-1.1L20 6z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.2"
          />
        </SvgRoot>
      );
  }
}

export type AchievementBadgeSize = "md" | "sm";

export function AchievementBadge(props: {
  id: string;
  unlocked: boolean;
  size?: AchievementBadgeSize;
  className?: string;
  style?: CSSProperties;
}) {
  const { id, unlocked, size = "md", className = "", style } = props;
  const slug = achievementBadgeSlug(id);
  const sizeClass = size === "sm" ? "achievement-badge--sm" : "achievement-badge--md";

  return (
    <div
      className={`achievement-badge ${sizeClass} achievement-badge--${slug}${unlocked ? "" : " achievement-badge--locked"} ${className}`.trim()}
      style={style}
      aria-hidden
    >
      <div className="achievement-badge__inner">
        <BadgeGraphic id={id} />
      </div>
      {!unlocked ? (
        <span className="achievement-badge__lock" title="Ещё не получено">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
            <path d="M12 7V5a4 4 0 10-8 0v2H4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 00-1-1h-1zm-1 0H5V5a3 3 0 016 0v2z" />
          </svg>
        </span>
      ) : null}
    </div>
  );
}
