import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dismissOnboarding, isOnboardingDismissed } from "./onboardingStorage";

describe("onboardingStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("starts false", () => {
    expect(isOnboardingDismissed()).toBe(false);
  });

  it("persists dismiss", () => {
    dismissOnboarding();
    expect(isOnboardingDismissed()).toBe(true);
  });
});
