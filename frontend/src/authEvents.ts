const EVT = "guardsim-auth-changed";

/** Вызвать после login/register/logout/сброса токена, чтобы обновить профиль в шапке без лишних запросов на каждый маршрут. */
export function notifyAuthChanged(): void {
  globalThis.dispatchEvent(new CustomEvent(EVT));
}

export function subscribeAuthChanged(handler: () => void): () => void {
  globalThis.addEventListener(EVT, handler);
  return () => globalThis.removeEventListener(EVT, handler);
}
