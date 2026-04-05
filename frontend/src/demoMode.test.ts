import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserMe } from "./types";

const { mockGetAuthToken, mockIsJwtExpired } = vi.hoisted(() => ({
  mockGetAuthToken: vi.fn<() => string | null>(),
  mockIsJwtExpired: vi.fn<(t: string) => boolean>(),
}));

vi.mock("./authToken", () => ({
  getAuthToken: () => mockGetAuthToken(),
}));

vi.mock("./jwtPayload", () => ({
  isJwtExpired: (t: string) => mockIsJwtExpired(t),
}));

import { canUseAppRoutes, isDemoModeActive, isRegisteredInUi, setDemoModeActive } from "./demoMode";

function me(partial: Partial<UserMe>): UserMe {
  return {
    playerId: "p",
    email: "e@e.e",
    guest: false,
    ...partial,
  };
}

describe("demoMode", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetAuthToken.mockReset();
    mockIsJwtExpired.mockReset();
  });

  it("isDemoModeActive reads storage", () => {
    expect(isDemoModeActive()).toBe(false);
    setDemoModeActive(true);
    expect(isDemoModeActive()).toBe(true);
    setDemoModeActive(false);
    expect(isDemoModeActive()).toBe(false);
  });

  it("canUseAppRoutes allows demo without token", () => {
    mockGetAuthToken.mockReturnValue(null);
    setDemoModeActive(true);
    expect(canUseAppRoutes(null)).toBe(true);
  });

  it("canUseAppRoutes requires non-guest when token valid", () => {
    mockGetAuthToken.mockReturnValue("tok");
    mockIsJwtExpired.mockReturnValue(false);
    expect(canUseAppRoutes(me({ guest: true }))).toBe(false);
    expect(canUseAppRoutes(me({ guest: false }))).toBe(true);
  });

  it("isRegisteredInUi requires token and non-guest me", () => {
    mockGetAuthToken.mockReturnValue(null);
    expect(isRegisteredInUi(me({ guest: false }))).toBe(false);
    mockGetAuthToken.mockReturnValue("tok");
    mockIsJwtExpired.mockReturnValue(false);
    expect(isRegisteredInUi(me({ guest: false }))).toBe(true);
    expect(isRegisteredInUi(me({ guest: true }))).toBe(false);
  });
});
