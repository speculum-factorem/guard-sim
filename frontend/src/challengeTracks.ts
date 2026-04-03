/**
 * Тематические дорожки (как Quest на LeetCode): порядок сценариев внутри дорожки.
 * id сценариев должны совпадать с backend ScenarioRegistry.
 */
export type TrackAccent = "mint" | "lilac" | "orange" | "yellow";

export interface ChallengeTrackDef {
  id: string;
  title: string;
  description: string;
  /** id сценариев по порядку прохождения дорожки */
  scenarioIds: string[];
  accent: TrackAccent;
}

export const CHALLENGE_TRACKS: ChallengeTrackDef[] = [
  {
    id: "inbox-threats",
    title: "Входящие под ударом",
    description: "Почта: фишинг, вложения, подмена реквизитов и фальш-HR — от базы к сложным кейсам.",
    scenarioIds: [
      "phishing-email",
      "malicious-attachment",
      "vendor-payment-bec",
      "hr-portal-phish",
      "it-support-lookalike",
    ],
    accent: "mint",
  },
  {
    id: "social-commerce",
    title: "Лента и сделки",
    description: "Соцсети и площадки: розыгрыши, уход с эскроу, давление на скорость.",
    scenarioIds: ["social-prize", "marketplace-off-platform"],
    accent: "lilac",
  },
  {
    id: "soc-response",
    title: "ИБ: инциденты",
    description: "Для роли администратора безопасности: цепочки атак и vishing.",
    scenarioIds: ["combined-ceo-phish", "exec-wire-vishing"],
    accent: "orange",
  },
];
