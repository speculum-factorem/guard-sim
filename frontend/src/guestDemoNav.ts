import type { NavigateFunction } from "react-router-dom";
import { notifyAuthChanged } from "./authEvents";
import { clearAuthToken } from "./authToken";
import { resetGuestPlayerId } from "./playerId";

/** Режим гостя: без JWT, новый локальный игрок, основной экран приложения. */
export function navigateToGuestDashboard(navigate: NavigateFunction): void {
  clearAuthToken();
  resetGuestPlayerId();
  notifyAuthChanged();
  navigate("/dashboard", { replace: true });
}
