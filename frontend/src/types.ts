export type ScenarioType = "EMAIL" | "SOCIAL";

export type CareerRole = "INTERN" | "EMPLOYEE" | "SECURITY_ADMIN";

export interface ScenarioSummary {
  id: string;
  title: string;
  type: ScenarioType;
  description: string;
  locked: boolean;
  requiredRole: CareerRole;
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
  | "MINI_URL_COMPARE";

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
  /** Лишний текст в письме — «шум» */
  narrativeNoise: string | null;
  /** Секунды для мягкого таймера давления (без санкций при нуле) */
  pressureSeconds: number | null;
  redFlagGame: RedFlagGame | null;
  /** Описание ситуации для игрока (вне «экрана» симуляции) */
  situationBrief?: string | null;
}

export interface ScenarioDetail {
  id: string;
  title: string;
  type: ScenarioType;
  description: string;
  steps: StepPublic[];
}

export interface StartSessionResponse {
  sessionId: string;
  scenarioId: string;
  scenarioTitle: string;
  currentStep: StepPublic;
  stepIndex: number;
  totalSteps: number;
}

export interface AchievementDto {
  id: string;
  title: string;
  description: string;
}

export interface CareerSnapshot {
  reputation: number;
  reputationDelta: number;
  role: CareerRole;
  roleChanged: boolean;
  perfectScenarioStreak: number;
  newAchievements: AchievementDto[];
}

export interface AnswerResponse {
  correct: boolean;
  explanation: string;
  totalScore: number;
  completed: boolean;
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
  role: CareerRole;
  perfectScenarioStreak: number;
  completedScenarioIds: string[];
  achievements: PlayerAchievementState[];
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
