import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAccountScrollSpy } from "./useAccountScrollSpy";

describe("useAccountScrollSpy", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty string when sectionIds empty", () => {
    const { result } = renderHook(() => useAccountScrollSpy([], true));
    expect(result.current).toBe("");
  });

  it("when disabled keeps first section id", () => {
    const { result } = renderHook(() => useAccountScrollSpy(["alpha", "beta"], false));
    expect(result.current).toBe("alpha");
  });

  it("picks highest intersectionRatio among visible sections", async () => {
    let cb: IntersectionObserverCallback | undefined;
    class MockIO {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(callback: IntersectionObserverCallback) {
        cb = callback;
      }
    }
    vi.stubGlobal("IntersectionObserver", MockIO);

    const a = document.createElement("div");
    a.id = "sec-a";
    const b = document.createElement("div");
    b.id = "sec-b";
    document.body.append(a, b);

    const { result } = renderHook(() => useAccountScrollSpy(["sec-a", "sec-b"], true));

    expect(cb).toBeDefined();
    const e1 = { isIntersecting: true, intersectionRatio: 0.2, target: a } as unknown as IntersectionObserverEntry;
    const e2 = { isIntersecting: true, intersectionRatio: 0.6, target: b } as unknown as IntersectionObserverEntry;
    cb!([e1, e2], {} as IntersectionObserver);

    await waitFor(() => {
      expect(result.current).toBe("sec-b");
    });
  });
});
