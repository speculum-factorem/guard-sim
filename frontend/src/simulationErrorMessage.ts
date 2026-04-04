import { ApiHttpError } from "./api";

/** Единое сообщение при истекшей сессии / 401 / 403 в симуляции. */
export function simulationHttpErrorMessage(e: unknown): string | null {
  if (e instanceof ApiHttpError && (e.status === 401 || e.status === 403)) {
    return "Сессия истекла или доступ к сценарию запрещён. Вернитесь к списку задач и откройте сценарий снова.";
  }
  return null;
}
