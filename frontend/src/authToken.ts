const STORAGE_KEY = "guardsim-auth-token";

export function getAuthToken(): string | null {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  globalThis.localStorage.setItem(STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  globalThis.localStorage.removeItem(STORAGE_KEY);
}
