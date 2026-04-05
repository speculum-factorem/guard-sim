import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPlayerId, resetGuestPlayerId, setPlayerId } from "./playerId";

describe("playerId", () => {
  beforeEach(() => {
    localStorage.clear();
    let salt = 0;
    vi.stubGlobal(
      "crypto",
      {
        getRandomValues(arr: Uint8Array) {
          salt += 1;
          for (let i = 0; i < arr.length; i++) arr[i] = (i * 17 + 3 + salt) % 256;
          return arr;
        },
      } as Crypto,
    );
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("creates and reuses id", () => {
    const a = getPlayerId();
    const b = getPlayerId();
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("setPlayerId overwrites", () => {
    setPlayerId("00000000-0000-4000-8000-000000000001");
    expect(getPlayerId()).toBe("00000000-0000-4000-8000-000000000001");
  });

  it("resetGuestPlayerId returns new uuid", () => {
    const first = getPlayerId();
    const second = resetGuestPlayerId();
    expect(second).not.toBe(first);
    expect(getPlayerId()).toBe(second);
  });
});
