import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMe, fetchPlayerState, fetchScenarios } from "../api";
import { notifyAuthChanged } from "../authEvents";
import { setDemoModeActive } from "../demoMode";
import { clearAuthToken } from "../authToken";
import { resetGuestPlayerId } from "../playerId";
import { experienceSummary, levelLabel, xpIntoCurrentLevel } from "../progressLabels";
import { useAccountScrollSpy } from "../hooks/useAccountScrollSpy";
import { DASHBOARD_TASKS_HREF } from "../navigationConstants";
import { syncWeeklyGoal } from "../weeklyGoalStorage";
import type { PlayerState, ScenarioSummary, UserMe } from "../types";

const ACCOUNT_SECTION_IDS = ["account-stats", "account-profile", "account-history", "account-rewards"] as const;

const ACCOUNT_NAV: { id: (typeof ACCOUNT_SECTION_IDS)[number]; label: string }[] = [
  { id: "account-stats", label: "Статистика" },
  { id: "account-profile", label: "Прогресс" },
  { id: "account-history", label: "История задач" },
  { id: "account-rewards", label: "Награды" },
];

const HISTORY_PAGE_SIZE = 8;

function scenarioTypeRu(t: ScenarioSummary["type"]): string {
  return t === "EMAIL" ? "Почта" : "Лента";
}

function initialsFromEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) {
    return "?";
  }
  const local = email.split("@")[0] ?? "";
  if (local.length >= 2) {
    return local.slice(0, 2).toUpperCase();
  }
  return local.toUpperCase() || "?";
}

export function AccountPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<UserMe | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, p, s] = await Promise.all([
          fetchMe().catch(() => null),
          fetchPlayerState(),
          fetchScenarios(),
        ]);
        if (cancelled) {
          return;
        }
        setMe(m);
        setPlayer(p);
        setScenarios(s);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Не удалось загрузить профиль");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const weekly = useMemo(() => (player ? syncWeeklyGoal(player.completedScenarioIds) : null), [player]);

  const progress = useMemo(() => {
    if (!player || !scenarios) {
      return null;
    }
    const total = scenarios.length;
    const solved = player.completedScenarioIds.filter((id) => scenarios.some((x) => x.id === id)).length;
    const pct = total === 0 ? 0 : Math.round((solved / total) * 100);
    return { total, solved, pct };
  }, [player, scenarios]);

  const historyRows = useMemo(() => {
    if (!player || !scenarios) {
      return [];
    }
    const byId = new Map(scenarios.map((s) => [s.id, s]));
    return [...player.completedScenarioIds]
      .map((id) => byId.get(id))
      .filter((x): x is ScenarioSummary => x != null)
      .sort((a, b) => a.title.localeCompare(b.title, "ru"));
  }, [player, scenarios]);

  const [historyVisible, setHistoryVisible] = useState(HISTORY_PAGE_SIZE);

  useEffect(() => {
    setHistoryVisible(HISTORY_PAGE_SIZE);
  }, [historyRows.length, player?.clientId]);

  const historyPage = useMemo(
    () => historyRows.slice(0, historyVisible),
    [historyRows, historyVisible],
  );
  const historyHasMore = historyVisible < historyRows.length;

  const activeSection = useAccountScrollSpy(ACCOUNT_SECTION_IDS, Boolean(player && scenarios));

  function logout() {
    clearAuthToken();
    setDemoModeActive(false);
    /* Новый локальный игрок: иначе /api/auth/me по старому X-GuardSim-Player всё ещё находит аккаунт без JWT */
    resetGuestPlayerId();
    notifyAuthChanged();
    navigate("/", { replace: true });
  }

  const displayName = me?.guest || !me?.email ? "Гость" : me.email.split("@")[0] ?? "Игрок";
  const subtitle =
    me == null
      ? "Локальный профиль в браузере. Войдите, чтобы сохранить прогресс на аккаунте."
      : me.guest
        ? "Локальный прогресс в браузере. Войдите, чтобы привязать аккаунт."
        : me.email ?? "Профиль игрока";

  return (
    <div className="account-page lc-theme">
      <div className="account-shell">
        {error ? <div className="error-banner account-error">{error}</div> : null}

        {!player || !scenarios ? (
          <div className="account-loading" aria-busy="true">
            <div className="account-skel account-skel--hero" />
            <div className="account-skel-grid">
              <div className="account-skel account-skel--side" />
              <div className="account-skel account-skel--main" />
            </div>
          </div>
        ) : (
          <>
            <header className="account-hero">
              <div className="account-avatar" aria-hidden>
                {initialsFromEmail(me?.email)}
              </div>
              <div className="account-hero-text">
                <h1 className="account-title">{displayName}</h1>
                <p className="account-subtitle">{subtitle}</p>
                <p className="account-id-line">
                  <span className="account-id-label">ID игрока</span>
                  <code className="account-id-value">{player.clientId}</code>
                </p>
                {me && !me.guest ? (
                  <div className="account-hero-actions">
                    <button type="button" className="btn btn-secondary account-logout-btn" onClick={logout}>
                      Выйти
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="account-hero-badges">
                <div className="account-badge-card account-badge-card--accent">
                  <span className="account-badge-value">{levelLabel(player.level)}</span>
                  <span className="account-badge-label">{player.experience} XP</span>
                </div>
                <div className="account-badge-card">
                  <span className="account-badge-value">{player.reputation}%</span>
                  <span className="account-badge-label">Доверие</span>
                </div>
                <div className="account-badge-card">
                  <span className="account-badge-value">{player.perfectScenarioStreak}</span>
                  <span className="account-badge-label">Серия</span>
                </div>
                {progress ? (
                  <div className="account-badge-card account-badge-card--accent">
                    <span className="account-badge-value">
                      {progress.solved}/{progress.total}
                    </span>
                    <span className="account-badge-label">Сценарии</span>
                  </div>
                ) : null}
              </div>
            </header>

            <div className="account-layout">
              <aside className="account-sidebar" aria-label="Разделы профиля">
                <nav className="account-side-nav">
                  {ACCOUNT_NAV.map((item) => (
                    <a
                      key={item.id}
                      className={`account-side-link${activeSection === item.id ? " account-side-link--active" : ""}`}
                      href={`#${item.id}`}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </aside>

              <div className="account-main">
                <section className="account-panel" id="account-stats" aria-labelledby="account-stats-h">
                  <h2 id="account-stats-h" className="account-panel-title">
                    Статистика
                  </h2>
                  <div className="account-stat-grid">
                    <div className="account-stat-card">
                      <span className="account-stat-num">{progress?.solved ?? 0}</span>
                      <span className="account-stat-desc">Решено сценариев</span>
                    </div>
                    <div className="account-stat-card">
                      <span className="account-stat-num">{progress?.total ?? 0}</span>
                      <span className="account-stat-desc">В каталоге</span>
                    </div>
                    <div className="account-stat-card">
                      <span className="account-stat-num">{progress?.pct ?? 0}%</span>
                      <span className="account-stat-desc">Прогресс каталога</span>
                    </div>
                    <div className="account-stat-card">
                      <span className="account-stat-num">{player.reputation}%</span>
                      <span className="account-stat-desc">Доверие клиентов</span>
                    </div>
                    <div className="account-stat-card">
                      <span className="account-stat-num">{player.perfectScenarioStreak}</span>
                      <span className="account-stat-desc">Идеальных сценариев подряд</span>
                    </div>
                    {weekly ? (
                      <div className="account-stat-card account-stat-card--weekly">
                        <span className="account-stat-num">
                          {weekly.current}/{weekly.target}
                        </span>
                        <span className="account-stat-desc">Цель недели (новые прохождения)</span>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="account-panel" id="account-profile" aria-labelledby="account-profile-h">
                  <h2 id="account-profile-h" className="account-panel-title">
                    Прогресс
                  </h2>
                  <div className="account-profile-card">
                    <p className="account-profile-body">{experienceSummary(player.experience)}</p>
                    <div
                      className="account-xp-bar"
                      aria-hidden
                      title={`Внутри уровня: ${xpIntoCurrentLevel(player.experience)}/100 XP`}
                    >
                      <div
                        className="account-xp-bar-fill"
                        style={{ width: `${xpIntoCurrentLevel(player.experience)}%` }}
                      />
                    </div>
                    <dl className="account-dl">
                      <div className="account-dl-row">
                        <dt>Уровень</dt>
                        <dd>{levelLabel(player.level)}</dd>
                      </div>
                      <div className="account-dl-row">
                        <dt>Опыт</dt>
                        <dd>{player.experience} XP</dd>
                      </div>
                      <div className="account-dl-row">
                        <dt>Репутация (доверие)</dt>
                        <dd>{player.reputation}%</dd>
                      </div>
                      <div className="account-dl-row">
                        <dt>Режим аккаунта</dt>
                        <dd>{me == null ? "Без входа (локальный ID)" : me.guest ? "Гость" : "Зарегистрирован"}</dd>
                      </div>
                    </dl>
                  </div>
                </section>

                <section className="account-panel" id="account-history" aria-labelledby="account-history-h">
                  <div className="account-panel-head">
                    <h2 id="account-history-h" className="account-panel-title">
                      История задач
                    </h2>
                    <Link to={DASHBOARD_TASKS_HREF} className="btn btn-secondary account-panel-link">
                      К каталогу
                    </Link>
                  </div>
                  {historyRows.length === 0 ? (
                    <div className="account-empty-row">
                      <p className="account-empty">
                        Пока нет завершённых сценариев — откройте каталог и начните задачу.
                      </p>
                      <Link to={DASHBOARD_TASKS_HREF} className="btn btn-primary account-empty-cta">
                        Перейти к задачам
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="account-table-wrap">
                        <table className="account-table">
                          <thead>
                            <tr>
                              <th scope="col">Сценарий</th>
                              <th scope="col">Канал</th>
                              <th scope="col">Статус</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyPage.map((row) => (
                              <tr key={row.id}>
                                <td>
                                  <span className="account-table-title">{row.title}</span>
                                </td>
                                <td>
                                  <span className={`account-channel account-channel--${row.type.toLowerCase()}`}>
                                    {scenarioTypeRu(row.type)}
                                  </span>
                                </td>
                                <td>
                                  <span className="account-status">Пройдено</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {historyHasMore ? (
                        <div className="account-history-more">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setHistoryVisible((n) => n + HISTORY_PAGE_SIZE)}
                          >
                            Показать ещё
                          </button>
                          <span className="account-history-more-meta">
                            Показано {historyPage.length} из {historyRows.length}
                          </span>
                        </div>
                      ) : historyRows.length > HISTORY_PAGE_SIZE ? (
                        <p className="account-history-end">Показаны все {historyRows.length} записей</p>
                      ) : null}
                    </>
                  )}
                </section>

                <section className="account-panel" id="account-rewards" aria-labelledby="account-rewards-h">
                  <h2 id="account-rewards-h" className="account-panel-title">
                    Награды
                  </h2>
                  <p className="account-rewards-lead">
                    Достижения разблокируются по мере прохождения сценариев и роста доверия.
                  </p>
                  <ul className="account-rewards-grid">
                    {player.achievements.map((a) => (
                      <li
                        key={a.id}
                        className={`account-reward-tile${a.unlocked ? " account-reward-tile--on" : ""}`}
                      >
                        <span className="account-reward-ico" aria-hidden>
                          {a.unlocked ? "★" : "○"}
                        </span>
                        <div className="account-reward-text">
                          <span className="account-reward-name">{a.title}</span>
                          <span className="account-reward-desc">{a.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
