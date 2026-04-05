import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "guardsim-player-id";

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

export async function getPlayerId(): Promise<string> {
  let id = await AsyncStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = newRandomUuid();
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export async function setPlayerId(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, id);
}

export async function resetGuestPlayerId(): Promise<string> {
  const id = newRandomUuid();
  await AsyncStorage.setItem(STORAGE_KEY, id);
  return id;
}
