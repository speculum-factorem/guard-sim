import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NavigateFunction } from "react-router-dom";

const guestNavMocks = vi.hoisted(() => ({
  setDemoModeActive: vi.fn(),
  notifyAuthChanged: vi.fn(),
  clearAuthToken: vi.fn(),
  resetGuestPlayerId: vi.fn(),
}));

vi.mock("./demoMode", () => ({ setDemoModeActive: guestNavMocks.setDemoModeActive }));
vi.mock("./authEvents", () => ({ notifyAuthChanged: guestNavMocks.notifyAuthChanged }));
vi.mock("./authToken", () => ({ clearAuthToken: guestNavMocks.clearAuthToken }));
vi.mock("./playerId", () => ({ resetGuestPlayerId: guestNavMocks.resetGuestPlayerId }));

import { navigateToGuestDashboard } from "./guestDemoNav";

describe("navigateToGuestDashboard", () => {
  beforeEach(() => {
    guestNavMocks.setDemoModeActive.mockClear();
    guestNavMocks.notifyAuthChanged.mockClear();
    guestNavMocks.clearAuthToken.mockClear();
    guestNavMocks.resetGuestPlayerId.mockClear();
  });

  it("enables demo, clears session hooks, navigates to dashboard", () => {
    const navigate = vi.fn() as unknown as NavigateFunction;
    navigateToGuestDashboard(navigate);
    expect(guestNavMocks.setDemoModeActive).toHaveBeenCalledWith(true);
    expect(guestNavMocks.clearAuthToken).toHaveBeenCalled();
    expect(guestNavMocks.resetGuestPlayerId).toHaveBeenCalled();
    expect(guestNavMocks.notifyAuthChanged).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });
});
