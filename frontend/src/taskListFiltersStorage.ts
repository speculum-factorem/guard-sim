/**
 * Сохранение фильтров списка задач (дашборд) в localStorage.
 */

export type TaskChannelFilter = "all" | "mail" | "social" | "security";
export type TaskSortColumn = "status" | "title" | "channel" | "role";
export type TaskSortDir = "asc" | "desc";

const STORAGE_KEY = "guardSim.taskListFilters.v1";
const PAGE_SIZES = new Set([10, 25, 50]);

export interface TaskListFiltersSnapshot {
  query: string;
  channel: TaskChannelFilter;
  sortColumn: TaskSortColumn;
  sortDir: TaskSortDir;
  pageSize: number;
  /** false = скрыть пройденные сценарии */
  showCompleted: boolean;
}

const DEFAULTS: TaskListFiltersSnapshot = {
  query: "",
  channel: "all",
  sortColumn: "status",
  sortDir: "asc",
  pageSize: 10,
  showCompleted: true,
};

function isChannel(x: unknown): x is TaskChannelFilter {
  return x === "all" || x === "mail" || x === "social" || x === "security";
}

function isSortColumn(x: unknown): x is TaskSortColumn {
  return x === "status" || x === "title" || x === "channel" || x === "role";
}

function isSortDir(x: unknown): x is TaskSortDir {
  return x === "asc" || x === "desc";
}

export function loadTaskListFilters(): TaskListFiltersSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULTS };
    }
    const p = JSON.parse(raw) as Partial<TaskListFiltersSnapshot>;
    const query = typeof p.query === "string" ? p.query : DEFAULTS.query;
    const channel = isChannel(p.channel) ? p.channel : DEFAULTS.channel;
    const sortColumn = isSortColumn(p.sortColumn) ? p.sortColumn : DEFAULTS.sortColumn;
    const sortDir = isSortDir(p.sortDir) ? p.sortDir : DEFAULTS.sortDir;
    const ps = typeof p.pageSize === "number" && PAGE_SIZES.has(p.pageSize) ? p.pageSize : DEFAULTS.pageSize;
    const showCompleted = typeof p.showCompleted === "boolean" ? p.showCompleted : DEFAULTS.showCompleted;
    return { query, channel, sortColumn, sortDir, pageSize: ps, showCompleted };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveTaskListFilters(state: TaskListFiltersSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export { DEFAULTS as TASK_LIST_FILTERS_DEFAULTS };
