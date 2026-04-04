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
  /** Рекомендация новичкам: плашка «Начните с этой дорожки», пока мало пройдено всего */
  recommendedForNewcomers?: boolean;
}

/** Пока пройдено сценариев меньше этого числа — показываем рекомендацию дорожки для новичков */
export const NEWCOMER_COMPLETION_THRESHOLD = 5;

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
    recommendedForNewcomers: true,
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
    description: "Сложные цепочки атак и vishing — как в работе ИБ.",
    scenarioIds: ["combined-ceo-phish", "exec-wire-vishing"],
    accent: "orange",
  },
  {
    id: "consumer-accounts-scams",
    title: "Учётки и деньги (быт)",
    description:
      "Смсишинг и поддельный сайт банка, вишинг «антифрода», фишинг под утечку пароля (stuffing) и перевод «другу» на новую карту.",
    scenarioIds: [
      "smishing-bank-card-unblock",
      "vishing-bank-fake-security-call",
      "credential-stuffing-fake-lockout",
      "chat-friend-new-card-scam",
    ],
    accent: "lilac",
  },
  {
    id: "search-and-perimeter",
    title: "Поиск и периметр",
    description:
      "Два разных интерфейса: распознать официальный сайт в выдаче и среагировать на перегрузку периметра, не роняя легитимный трафик.",
    scenarioIds: ["search-bank-official-serp", "perimeter-ddos-net-shield"],
    accent: "orange",
  },
  {
    id: "benign-baseline",
    title: "Когда угрозы нет",
    description:
      "Штатные уведомления IT, внутренний мессенджер, календарь и расширения из белого списка — учимся не паниковать зря и не ломать работу.",
    scenarioIds: [
      "email-it-maintenance-benign",
      "messenger-internal-benign",
      "calendar-legit-invite",
      "extension-allowlist-benign",
    ],
    accent: "yellow",
  },
];
