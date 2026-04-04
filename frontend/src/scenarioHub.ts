import type { ScenarioSummary } from "./types";

/** Сценарии дорожки «ИБ: инциденты» — колонка «ИБ» на хабе. */
const SECURITY_SCENARIO_IDS = new Set<string>(["combined-ceo-phish", "exec-wire-vishing"]);

export function typeLabel(t: ScenarioSummary["type"]): string {
  if (t === "EMAIL") {
    return "Почта";
  }
  return "Соцсеть";
}

export function typeClass(t: ScenarioSummary["type"]): string {
  return t === "EMAIL" ? "card-badge-email" : "card-badge-social";
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
  if (SECURITY_SCENARIO_IDS.has(s.id)) {
    return "security";
  }
  if (s.type === "SOCIAL") {
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
