/**
 * Ссылка на блок задач дашборда. Фильтры таблицы подхватываются из localStorage (`taskListFiltersStorage`).
 */
export const DASHBOARD_TASKS_HREF = "/dashboard#tasks";

/** Куда вести после успешного входа/регистрации, если параметр `next` не задан или невалиден. */
export const DEFAULT_AFTER_AUTH = "/dashboard";

/**
 * Безопасный путь после авторизации: только относительные пути, без open-redirect.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (raw == null || raw === "") {
    return DEFAULT_AFTER_AUTH;
  }
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_AFTER_AUTH;
  }
  return trimmed;
}

/** Ссылка на страницу входа с возвратом на указанный путь после успешной авторизации. */
export function loginHref(nextPath: string): string {
  const n = safeNextPath(nextPath);
  return `/login?${new URLSearchParams({ next: n }).toString()}`;
}
