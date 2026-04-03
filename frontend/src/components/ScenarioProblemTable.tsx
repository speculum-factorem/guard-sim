import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { careerTitle } from "../careerLabels";
import type { CareerRole, ScenarioSummary } from "../types";
import { channelLabel, hubColumnForScenario } from "../scenarioHub";

type ChannelFilter = "all" | "mail" | "social" | "security";
type SortColumn = "status" | "title" | "channel" | "role";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50] as const;

function roleOrder(role: CareerRole): number {
  if (role === "INTERN") {
    return 0;
  }
  if (role === "EMPLOYEE") {
    return 1;
  }
  return 2;
}

function statusRank(s: ScenarioSummary, completed: Set<string>): number {
  if (s.locked) {
    return 2;
  }
  if (completed.has(s.id)) {
    return 1;
  }
  return 0;
}

function compareRows(
  a: ScenarioSummary,
  b: ScenarioSummary,
  column: SortColumn,
  dir: SortDir,
  completed: Set<string>,
): number {
  const mul = dir === "asc" ? 1 : -1;
  let cmp = 0;
  switch (column) {
    case "title":
      cmp = a.title.localeCompare(b.title, "ru");
      break;
    case "channel": {
      const order = (c: "mail" | "social" | "security") => (c === "mail" ? 0 : c === "social" ? 1 : 2);
      cmp = order(hubColumnForScenario(a)) - order(hubColumnForScenario(b));
      break;
    }
    case "role":
      cmp = roleOrder(a.requiredRole) - roleOrder(b.requiredRole);
      break;
    case "status":
      cmp = statusRank(a, completed) - statusRank(b, completed);
      break;
    default:
      break;
  }
  if (cmp !== 0) {
    return cmp * mul;
  }
  return a.title.localeCompare(b.title, "ru");
}

function StatusPill({ s, completed }: { s: ScenarioSummary; completed: Set<string> }) {
  if (s.locked) {
    return <span className="lc-status lc-status--locked">Заблокировано</span>;
  }
  if (completed.has(s.id)) {
    return <span className="lc-status lc-status--done">Пройдено</span>;
  }
  return <span className="lc-status lc-status--todo">Доступно</span>;
}

export function ScenarioProblemTable(props: { items: ScenarioSummary[]; completedIds: string[] }) {
  const { items, completedIds } = props;
  const completed = useMemo(() => new Set(completedIds), [completedIds]);

  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = items;
    if (channel !== "all") {
      list = list.filter((s) => hubColumnForScenario(s) === channel);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, channel, query]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => compareRows(a, b, sortColumn, sortDir, completed)),
    [filtered, sortColumn, sortDir, completed],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, channel, pageSize, sortColumn, sortDir]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(pageStart, pageStart + pageSize);

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDir(column === "title" ? "asc" : "asc");
    }
  }

  function sortIndicator(column: SortColumn) {
    if (sortColumn !== column) {
      return <span className="lc-th-sort" aria-hidden />;
    }
    return <span className="lc-th-sort lc-th-sort--active">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const rangeLabel =
    sorted.length === 0
      ? "Нет задач"
      : `${pageStart + 1}–${Math.min(pageStart + pageRows.length, sorted.length)} из ${sorted.length}`;

  return (
    <section className="lc-problems" id="tasks" aria-labelledby="tasks-heading">
      <div className="lc-problems-head">
        <h2 className="section-heading lc-problems-title" id="tasks-heading">
          Задачи
        </h2>
        <p className="page-subtitle lc-problems-lead">
          Сценарии в духе тренажёра: поиск, фильтр по каналу, сортировка по столбцам и постраничный просмотр.
        </p>
      </div>

      <div className="lc-toolbar">
        <label className="lc-search-wrap">
          <span className="lc-visually-hidden">Поиск по названию и описанию</span>
          <span className="lc-search-icon" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            className="lc-input lc-search-input"
            placeholder="Поиск по названию, описанию или id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>

        <div className="lc-toolbar-filters" role="group" aria-label="Фильтр по каналу">
          {(
            [
              ["all", "Все"],
              ["mail", "Почта"],
              ["social", "Лента"],
              ["security", "ИБ"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`lc-chip${channel === key ? " lc-chip--on" : ""}`}
              onClick={() => setChannel(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="lc-page-size">
          <span className="lc-page-size-label">На странице</span>
          <select
            className="lc-select"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="lc-table-wrap">
        <table className="lc-table">
          <thead>
            <tr>
              <th scope="col" className="lc-col-status">
                <button type="button" className="lc-th-btn" onClick={() => toggleSort("status")}>
                  Статус
                  {sortIndicator("status")}
                </button>
              </th>
              <th scope="col" className="lc-col-title">
                <button type="button" className="lc-th-btn" onClick={() => toggleSort("title")}>
                  Задача
                  {sortIndicator("title")}
                </button>
              </th>
              <th scope="col" className="lc-col-channel">
                <button type="button" className="lc-th-btn" onClick={() => toggleSort("channel")}>
                  Канал
                  {sortIndicator("channel")}
                </button>
              </th>
              <th scope="col" className="lc-col-role">
                <button type="button" className="lc-th-btn" onClick={() => toggleSort("role")}>
                  Роль
                  {sortIndicator("role")}
                </button>
              </th>
              <th scope="col" className="lc-col-action">
                <span className="lc-th-static">Действие</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => {
              const col = hubColumnForScenario(s);
              return (
                <tr key={s.id} className={s.locked ? "lc-tr lc-tr--locked" : "lc-tr"}>
                  <td>
                    <StatusPill s={s} completed={completed} />
                  </td>
                  <td>
                    <div className="lc-title-cell">
                      {s.locked ? (
                        <span className="lc-title-locked">{s.title}</span>
                      ) : (
                        <Link to={`/play/${encodeURIComponent(s.id)}`} className="lc-title-link">
                          {s.title}
                        </Link>
                      )}
                      <p className="lc-title-desc">{s.description}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`lc-channel lc-channel--${col}`}>{channelLabel(col)}</span>
                  </td>
                  <td>
                    <span className="lc-role">{careerTitle(s.requiredRole)}</span>
                  </td>
                  <td>
                    {s.locked ? (
                      <span className="lc-action-muted">Недоступно</span>
                    ) : (
                      <Link to={`/play/${encodeURIComponent(s.id)}`} className="lc-action-link">
                        Решить
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 ? (
          <p className="lc-empty">Ничего не найдено. Измените запрос или фильтр.</p>
        ) : null}
      </div>

      {sorted.length > 0 ? (
        <nav className="lc-pager" aria-label="Пагинация списка задач">
          <span className="lc-pager-meta">{rangeLabel}</span>
          <div className="lc-pager-btns">
            <button
              type="button"
              className="lc-pager-btn"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Назад
            </button>
            <span className="lc-pager-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => {
                  if (totalPages <= 7) {
                    return true;
                  }
                  if (n === 1 || n === totalPages) {
                    return true;
                  }
                  return Math.abs(n - currentPage) <= 1;
                })
                .map((n, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showGap = prev !== undefined && n - prev > 1;
                  return (
                    <span key={n} className="lc-pager-page-wrap">
                      {showGap ? <span className="lc-pager-gap">…</span> : null}
                      <button
                        type="button"
                        className={`lc-pager-page${n === currentPage ? " lc-pager-page--current" : ""}`}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    </span>
                  );
                })}
            </span>
            <button
              type="button"
              className="lc-pager-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Вперёд
            </button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}
