import { Platform } from "react-native";

function defaultApiBase(): string {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080";
  }
  return "http://127.0.0.1:8080";
}

/** База без завершающего слэша. Переопределение: `EXPO_PUBLIC_API_BASE_URL` в `.env` или `app.config.js`. */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? defaultApiBase()
);
