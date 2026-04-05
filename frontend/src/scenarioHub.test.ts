import { describe, expect, it } from "vitest";
import {
  channelLabel,
  firstOpenScenarioId,
  hubBadgeClass,
  hubBadgeLabel,
  missionChannelLabel,
  splitScenariosByColumn,
} from "./scenarioHub";
import type { ScenarioSummary } from "./types";

function sum(id: string, hub: ScenarioSummary["hubChannel"]): ScenarioSummary {
  return {
    id,
    title: id,
    type: "EMAIL",
    description: "",
    hubChannel: hub,
    attackTypeLabel: "—",
  };
}

describe("hubBadgeLabel / hubBadgeClass", () => {
  it("maps channels", () => {
    expect(hubBadgeLabel(sum("1", "SECURITY"))).toBe("ИБ");
    expect(hubBadgeClass(sum("1", "SOCIAL"))).toBe("card-badge-social");
    expect(hubBadgeLabel(sum("1", "MAIL"))).toBe("Почта");
  });
});

describe("channelLabel", () => {
  it("matches hub columns", () => {
    expect(channelLabel("mail")).toBe("Почта");
    expect(channelLabel("security")).toBe("ИБ");
  });
});

describe("splitScenariosByColumn", () => {
  it("partitions lists", () => {
    const { mail, social, security } = splitScenariosByColumn([
      sum("a", "MAIL"),
      sum("b", "SOCIAL"),
      sum("c", "SECURITY"),
    ]);
    expect(mail.map((s) => s.id)).toEqual(["a"]);
    expect(social.map((s) => s.id)).toEqual(["b"]);
    expect(security.map((s) => s.id)).toEqual(["c"]);
  });
});

describe("firstOpenScenarioId", () => {
  it("prefers mail, then social, then security", () => {
    expect(
      firstOpenScenarioId({
        mail: [sum("m", "MAIL")],
        social: [sum("s", "SOCIAL")],
        security: [],
      }),
    ).toBe("m");
    expect(
      firstOpenScenarioId({
        mail: [],
        social: [sum("s", "SOCIAL")],
        security: [sum("x", "SECURITY")],
      }),
    ).toBe("s");
  });

  it("returns null when all empty", () => {
    expect(firstOpenScenarioId({ mail: [], social: [], security: [] })).toBeNull();
  });
});

describe("missionChannelLabel", () => {
  it("matches hub channel names", () => {
    expect(missionChannelLabel("MAIL")).toBe("Почта");
    expect(missionChannelLabel("SECURITY")).toBe("ИБ");
  });
});
