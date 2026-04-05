import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAccountScrollSpy } from "./useAccountScrollSpy";

function mockRect(top: number): DOMRect {
  return {
    top,
    left: 0,
    right: 100,
    bottom: top + 80,
    width: 100,
    height: 80,
    x: 0,
    y: top,
    toJSON() {
      return {};
    },
  } as DOMRect;
}

describe("useAccountScrollSpy", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true, writable: true });
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true, writable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 4000, configurable: true, writable: true });
  });

  it("returns empty string when sectionIds empty", () => {
    const { result } = renderHook(() => useAccountScrollSpy([], true));
    expect(result.current).toBe("");
  });

  it("when disabled keeps first section id", () => {
    const { result } = renderHook(() => useAccountScrollSpy(["alpha", "beta"], false));
    expect(result.current).toBe("alpha");
  });

  it("selects last section whose top is above activation line", async () => {
    const a = document.createElement("div");
    a.id = "sec-a";
    const b = document.createElement("div");
    b.id = "sec-b";
    document.body.append(a, b);
    vi.spyOn(a, "getBoundingClientRect").mockReturnValue(mockRect(200));
    vi.spyOn(b, "getBoundingClientRect").mockReturnValue(mockRect(40));

    const { result } = renderHook(() => useAccountScrollSpy(["sec-a", "sec-b"], true));

    await waitFor(() => {
      expect(result.current).toBe("sec-b");
    });
  });

  it("when only first section crosses line, stays on first", async () => {
    const a = document.createElement("div");
    a.id = "sec-a";
    const b = document.createElement("div");
    b.id = "sec-b";
    document.body.append(a, b);
    vi.spyOn(a, "getBoundingClientRect").mockReturnValue(mockRect(50));
    vi.spyOn(b, "getBoundingClientRect").mockReturnValue(mockRect(400));

    const { result } = renderHook(() => useAccountScrollSpy(["sec-a", "sec-b"], true));

    await waitFor(() => {
      expect(result.current).toBe("sec-a");
    });
  });
});
