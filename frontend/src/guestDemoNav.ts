import type { NavigateFunction } from "react-router-dom";
import { setDemoModeActive } from "./demoMode";
import { notifyAuthChanged } from "./authEvents";
import { clearAuthToken } from "./authToken";
import { resetGuestPlayerId } from "./playerId";

/** Режим демо: без JWT, новый локальный игрок, доступ к дашборду с гостевым прогрессом. */
export function navigateToGuestDashboard(navigate: NavigateFunction): void {
  setDemoModeActive(true);
  clearAuthToken();
  resetGuestPlayerId();
  notifyAuthChanged();
  navigate("/dashboard", { replace: true });
}
