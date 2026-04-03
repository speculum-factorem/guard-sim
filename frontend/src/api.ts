import { getPlayerId } from "./playerId";
import type {
  AnswerResponse,
  PlayerState,
  ScenarioDetail,
  ScenarioSummary,
  StartSessionResponse,
} from "./types";

const PLAYER_HEADER = "X-GuardSim-Player";

function withPlayerHeaders(base?: HeadersInit): HeadersInit {
  return {
    ...base,
    [PLAYER_HEADER]: getPlayerId(),
  };
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
      message =
        "API не найден (404). Запустите бэкенд на порту 8080 — например, make dev или make backend.";
    }
    throw new Error(message);
  }
  return JSON.parse(text) as T;
}

export async function fetchPlayerState(): Promise<PlayerState> {
  const res = await fetch("/api/player/state", { headers: withPlayerHeaders() });
  return handleJson(res);
}

export async function fetchScenarios(): Promise<ScenarioSummary[]> {
  const res = await fetch("/api/scenarios", { headers: withPlayerHeaders() });
  return handleJson(res);
}

export async function fetchScenario(id: string): Promise<ScenarioDetail> {
  const res = await fetch(`/api/scenarios/${encodeURIComponent(id)}`, { headers: withPlayerHeaders() });
  return handleJson(res);
}

export async function startSession(scenarioId: string): Promise<StartSessionResponse> {
  const res = await fetch(`/api/scenarios/${encodeURIComponent(scenarioId)}/sessions`, {
    method: "POST",
    headers: withPlayerHeaders(),
  });
  return handleJson(res);
}

export async function submitAnswer(
  sessionId: string,
  stepId: string,
  choiceId: string,
  investigationViewedIds: string[] = [],
  redFlagSelectionIds: string[] = [],
): Promise<AnswerResponse> {
  const res = await fetch(
    `/api/sessions/${encodeURIComponent(sessionId)}/steps/${encodeURIComponent(stepId)}/answer`,
    {
      method: "POST",
      headers: withPlayerHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ choiceId, investigationViewedIds, redFlagSelectionIds }),
    },
  );
  return handleJson(res);
}
