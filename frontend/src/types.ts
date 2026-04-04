export type ScenarioType = "EMAIL" | "SOCIAL";

/** Канал на хабе задач (с сервера) */
export type ScenarioHubChannel = "MAIL" | "SOCIAL" | "SECURITY";

export interface ScenarioSummary {
  id: string;
  title: string;
  type: ScenarioType;
  description: string;
  hubChannel: ScenarioHubChannel;
  /** Тип кибератаки (RU), с бэкенда */
  attackTypeLabel: string;
}

export interface ChoicePublic {
  id: string;
  label: string;
}

export type StepUiKind =
  | "GENERIC"
  | "EMAIL_CLIENT"
  | "SOCIAL_NOTIFICATION"
  | "DESK_TICKET"
  | "MINI_URL_COMPARE"
  | "SEARCH_ENGINE_RESULTS"
  | "NET_SHIELD_CONSOLE"
  | "CHAT_MESSENGER"
  | "CALENDAR_INVITE"
  | "EXTENSION_STORE"
  | "TERMINAL_SESSION"
  | "OAUTH_APPROVAL"
  | "VIRUSTOTAL_LOOKUP"
  | "MOBILE_PHONE_INCIDENT";

export interface InvestigationPanel {
  id: string;
  title: string;
  body: string;
}

export interface Hotspot {
  id: string;
  label: string;
  choiceId: string;
  variant: string;
}

export interface UrlCompareGame {
  leftUrl: string;
  rightUrl: string;
  leftChoiceId: string;
  rightChoiceId: string;
  caption: string;
}

export interface SerpResult {
  title: string;
  displayUrl: string;
  snippet: string;
  choiceId: string;
}

export interface SerpPickGame {
  query: string;
  results: SerpResult[];
}

export interface NetShieldRow {
  id: string;
  remoteIp: string;
  remoteHost: string;
  rateLabel: string;
  note: string | null;
  choiceId: string;
}

export interface NetShieldGame {
  consoleTitle: string;
  rows: NetShieldRow[];
}

export interface VirusTotalGame {
  scannedUrl: string;
  enginesFlagged: number;
  enginesTotal: number;
  permalinkStub: string;
  verdictHeadline: string;
}

export interface PhoneSmsLine {
  sender: string;
  text: string;
  time: string;
}

export interface PhoneCallOverlay {
  callerLabel: string;
  callerSubtitle: string;
  numberDisplay: string;
}

export interface PhoneIncidentGame {
  statusBarTime: string;
  networkLabel: string;
  screenTitle: string;
  smsLines: PhoneSmsLine[];
  callOverlay: PhoneCallOverlay;
}

export interface RedFlagCandidatePublic {
  id: string;
  label: string;
}

export interface RedFlagGame {
  instruction: string;
  candidates: RedFlagCandidatePublic[];
  requiredPickCount: number;
}

export interface StepPublic {
  id: string;
  narrative: string;
  choices: ChoicePublic[];
  uiKind: StepUiKind;
  emailSubject: string | null;
  emailFrom: string | null;
  investigationPanels: InvestigationPanel[];
  investigationBonusThreshold: number;
  hotspots: Hotspot[];
  urlCompareGame: UrlCompareGame | null;
  serpPickGame: SerpPickGame | null;
  netShieldGame: NetShieldGame | null;
  virusTotalGame: VirusTotalGame | null;
  phoneIncidentGame: PhoneIncidentGame | null;
  /** Лишний текст в письме — «шум» */
  narrativeNoise: string | null;
  /** Секунды для мягкого таймера давления (без санкций при нуле) */
  pressureSeconds: number | null;
  redFlagGame: RedFlagGame | null;
  /** Описание ситуации для игрока (вне «экрана» симуляции) */
  situationBrief?: string | null;
  /** CHAT_MESSENGER */
  simChatTitle?: string | null;
  simChatForwardFrom?: string | null;
  simChatSenderLabel?: string | null;
  /** CALENDAR_INVITE */
  simCalendarWhen?: string | null;
  simCalendarWhere?: string | null;
  /** EXTENSION_STORE */
  simExtensionName?: string | null;
  simExtensionPublisher?: string | null;
  simExtensionBlurb?: string | null;
}

export interface ScenarioDetail {
  id: string;
  title: string;
  type: ScenarioType;
  description: string;
  hubChannel: ScenarioHubChannel;
  attackTypeLabel: string;
  steps: StepPublic[];
}

export interface AttackTechnique {
  techniqueId: string;
  techniqueName: string;
  tactic: string;
  description: string;
}

export interface AttackBreakdown {
  summary: string;
  techniques: AttackTechnique[];
  howToDefend: string;
}

export interface StartSessionResponse {
  sessionId: string;
  scenarioId: string;
  scenarioTitle: string;
  currentStep: StepPublic;
  stepIndex: number;
  totalSteps: number;
  resumed?: boolean;
  totalScore?: number;
  attackBreakdown?: AttackBreakdown | null;
}

export interface AchievementDto {
  id: string;
  title: string;
  description: string;
}

export interface CareerSnapshot {
  reputation: number;
  reputationDelta: number;
  experience: number;
  experienceDelta: number;
  level: number;
  levelChanged: boolean;
  perfectScenarioStreak: number;
  newAchievements: AchievementDto[];
}

export interface AnswerResponse {
  correct: boolean;
  explanation: string;
  totalScore: number;
  completed: boolean;
  /** true — задание засчитано (все шаги без ошибок), false — были ошибки, XP и запись не выдаются */
  countedAsCompleted: boolean;
  nextStep: StepPublic | null;
  stepIndex: number;
  totalSteps: number;
  career: CareerSnapshot;
  consequenceBeat: string | null;
  investigationReputationDelta: number;
}

export interface PlayerAchievementState {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface PlayerState {
  clientId: string;
  reputation: number;
  experience: number;
  level: number;
  perfectScenarioStreak: number;
  completedScenarioIds: string[];
  achievements: PlayerAchievementState[];
  weeklyGoalCurrent: number;
  weeklyGoalTarget: number;
  weeklyGoalWeekStart: string | null;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  playerId: string;
  email: string;
}

export interface UserMe {
  playerId: string;
  email: string | null;
  guest: boolean;
}
