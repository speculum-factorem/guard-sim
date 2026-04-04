const STORAGE_KEY = "guardsim-player-id";

/**
 * UUID v4 без вызова crypto.randomUUID — в части WebView его нет или он сломан,
 * при этом getRandomValues обычно доступен.
 */
function newRandomUuid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    const b6 = bytes[6] ?? 0;
    const b8 = bytes[8] ?? 0;
    bytes[6] = (b6 & 0x0f) | 0x40;
    bytes[8] = (b8 & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getPlayerId(): string {
  let id = globalThis.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = newRandomUuid();
    globalThis.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/** После входа подставляем playerId с сервера */
export function setPlayerId(id: string): void {
  globalThis.localStorage.setItem(STORAGE_KEY, id);
}

/** Новый гостевой UUID (режим «Демо» без привязки к прошлому локальному игроку). */
export function resetGuestPlayerId(): string {
  const id = newRandomUuid();
  globalThis.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
