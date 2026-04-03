function base64UrlToJson(payload: string): Record<string, unknown> | null {
  try {
    let s = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const json = globalThis.atob(s);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Время истечения JWT в мс (Unix exp * 1000), или null если нет поля / не удалось разобрать. */
export function getJwtExpiryMs(token: string): number | null {
  const parts = token.split(".");
  const rawPayload = parts[1];
  if (rawPayload == null || rawPayload.length === 0) return null;
  const payload = base64UrlToJson(rawPayload);
  if (!payload) return null;
  const exp = payload.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  return exp * 1000;
}

export function isJwtExpired(token: string): boolean {
  const ms = getJwtExpiryMs(token);
  if (ms == null) return false;
  return Date.now() >= ms;
}
