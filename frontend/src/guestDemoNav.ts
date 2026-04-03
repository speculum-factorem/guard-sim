import type { NavigateFunction } from "react-router-dom";
import { clearAuthToken } from "./authToken";
import { getPlayerId } from "./playerId";

/** Режим гостя: без JWT, локальный ID игрока, основной экран приложения. */
export function navigateToGuestDashboard(navigate: NavigateFunction): void {
  clearAuthToken();
  getPlayerId();
  navigate("/dashboard", { replace: true });
}
