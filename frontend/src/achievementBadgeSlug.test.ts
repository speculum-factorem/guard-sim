import { describe, expect, it } from "vitest";
import { achievementBadgeSlug } from "./components/AchievementBadge";

describe("achievementBadgeSlug", () => {
  it("keeps slug-safe chars", () => {
    expect(achievementBadgeSlug("first-phishing-spotless")).toBe("first-phishing-spotless");
  });

  it("strips unsafe chars", () => {
    expect(achievementBadgeSlug("bad id!")).toBe("badid");
  });

  it("unknown when empty after strip", () => {
    expect(achievementBadgeSlug("!!!")).toBe("unknown");
  });
});
