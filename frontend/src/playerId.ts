const STORAGE_KEY = "guardsim-player-id";

export function getPlayerId(): string {
  let id = globalThis.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = globalThis.crypto.randomUUID();
    globalThis.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/** После входа подставляем playerId с сервера */
export function setPlayerId(id: string): void {
  globalThis.localStorage.setItem(STORAGE_KEY, id);
}
