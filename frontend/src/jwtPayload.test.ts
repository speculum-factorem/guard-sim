import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getJwtExpiryMs, isJwtExpired } from "./jwtPayload";

function b64url(obj: object): string {
  return globalThis
    .btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function makeJwt(expSec: number): string {
  return `e30.${b64url({ exp: expSec, sub: "x" })}.x`;
}

describe("jwtPayload", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads exp from payload", () => {
    const expSec = 1_700_000_000;
    expect(getJwtExpiryMs(makeJwt(expSec))).toBe(expSec * 1000);
  });

  it("isJwtExpired respects clock", () => {
    vi.setSystemTime(new Date("2024-06-01T12:00:00Z"));
    const future = Math.floor(Date.now() / 1000) + 3600;
    const past = Math.floor(Date.now() / 1000) - 60;
    expect(isJwtExpired(makeJwt(future))).toBe(false);
    expect(isJwtExpired(makeJwt(past))).toBe(true);
  });

  it("malformed token is not treated as expired by exp check", () => {
    expect(isJwtExpired("not-a-jwt")).toBe(false);
    expect(getJwtExpiryMs("not-a-jwt")).toBe(null);
  });
});
