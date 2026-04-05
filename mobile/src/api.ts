import { getAuthToken } from "./authToken";
import { isDemoModeActive } from "./demoMode";
import { getPlayerId } from "./playerId";
import { API_BASE_URL } from "./config";
import type {
  AnswerResponse,
  AuthResponse,
  PlayerState,
  ScenarioDetail,
  ScenarioSummary,
  StartSessionResponse,
  UserMe,
} from "./types";

const PLAYER_HEADER = "X-GuardSim-Player";
const DEMO_HEADER = "X-GuardSim-Demo";

async function withPlayerHeaders(base?: HeadersInit): Promise<Record<string, string>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    ...(base as Record<string, string>),
    [PLAYER_HEADER]: await getPlayerId(),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (await isDemoModeActive()) {
    headers[DEMO_HEADER] = "1";
  }
  return headers;
}

export class ApiHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
  }
}

async function handleJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = res.statusText || `Ошибка ${res.status}`;
    let fromBody = false;
    try {
      const body = JSON.parse(text) as { error?: string };
      if (typeof body.error === "string" && body.error.length > 0) {
        message = body.error;
        fromBody = true;
      }
    } catch {
      /* не JSON */
    }
    if (res.status === 404 && !fromBody) {
      message = `API не найден (404). Убедитесь, что бэкенд доступен по ${API_BASE_URL} и задайте EXPO_PUBLIC_API_BASE_URL при необходимости.`;
    }
    throw new ApiHttpError(res.status, message);
  }
  return JSON.parse(text) as T;
}

function url(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

export async function fetchPlayerState(): Promise<PlayerState> {
  const res = await fetch(url("/api/player/state"), { headers: await withPlayerHeaders() });
  return handleJson(res);
}

export async function fetchScenarios(): Promise<ScenarioSummary[]> {
  const res = await fetch(url("/api/scenarios"), { headers: await withPlayerHeaders() });
  return handleJson(res);
}

export async function fetchScenario(id: string): Promise<ScenarioDetail> {
  const res = await fetch(url(`/api/scenarios/${encodeURIComponent(id)}`), {
    headers: await withPlayerHeaders(),
  });
  return handleJson(res);
}

export async function startSession(
  scenarioId: string,
  options?: { restart?: boolean },
): Promise<StartSessionResponse> {
  const q = options?.restart ? "?restart=true" : "";
  const res = await fetch(url(`/api/scenarios/${encodeURIComponent(scenarioId)}/sessions${q}`), {
    method: "POST",
    headers: await withPlayerHeaders(),
  });
  return handleJson(res);
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(url("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson(res);
}

export async function registerRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(url("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleJson(res);
}

export async function fetchMe(): Promise<UserMe> {
  const res = await fetch(url("/api/auth/me"), { headers: await withPlayerHeaders() });
  return handleJson(res);
}

export async function submitAnswer(
  sessionId: string,
  stepId: string,
  choiceId: string,
  investigationViewedIds: string[] = [],
  redFlagSelectionIds: string[] = [],
  options?: { pressureExpired?: boolean },
): Promise<AnswerResponse> {
  const pressureExpired = !!options?.pressureExpired;
  const res = await fetch(
    url(`/api/sessions/${encodeURIComponent(sessionId)}/steps/${encodeURIComponent(stepId)}/answer`),
    {
      method: "POST",
      headers: await withPlayerHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        choiceId: pressureExpired ? "" : choiceId,
        investigationViewedIds,
        redFlagSelectionIds,
        pressureExpired,
      }),
    },
  );
  return handleJson(res);
}
