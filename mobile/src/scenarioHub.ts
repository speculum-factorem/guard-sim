import type { ScenarioHubChannel, ScenarioSummary } from "./types";

export function hubBadgeLabel(s: ScenarioSummary): string {
  switch (s.hubChannel) {
    case "SECURITY":
      return "ИБ";
    case "SOCIAL":
      return "Лента";
    default:
      return "Почта";
  }
}

export function channelLabel(col: "mail" | "social" | "security"): string {
  if (col === "mail") {
    return "Почта";
  }
  if (col === "social") {
    return "Лента";
  }
  return "ИБ";
}

export function hubColumnForScenario(s: ScenarioSummary): "mail" | "social" | "security" {
  if (s.hubChannel === "SECURITY") {
    return "security";
  }
  if (s.hubChannel === "SOCIAL") {
    return "social";
  }
  return "mail";
}

export function splitScenariosByColumn(items: ScenarioSummary[]): {
  mail: ScenarioSummary[];
  social: ScenarioSummary[];
  security: ScenarioSummary[];
} {
  const mail: ScenarioSummary[] = [];
  const social: ScenarioSummary[] = [];
  const security: ScenarioSummary[] = [];
  for (const s of items) {
    const col = hubColumnForScenario(s);
    if (col === "mail") mail.push(s);
    else if (col === "social") social.push(s);
    else security.push(s);
  }
  return { mail, social, security };
}

export function firstOpenScenarioId(columns: {
  mail: ScenarioSummary[];
  social: ScenarioSummary[];
  security: ScenarioSummary[];
}): string | null {
  for (const list of [columns.mail, columns.social, columns.security]) {
    const s = list[0];
    if (s) {
      return s.id;
    }
  }
  return null;
}

export function missionChannelLabel(hub: ScenarioHubChannel): string {
  switch (hub) {
    case "SECURITY":
      return "ИБ";
    case "SOCIAL":
      return "Лента";
    default:
      return "Почта";
  }
}
