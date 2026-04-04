/** Базовая проверка email (без полной RFC-совместимости). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  if (s.length < 5 || s.length > 254) {
    return false;
  }
  return EMAIL_RE.test(s);
}

/** Сообщение об ошибке email или null, если ок. */
export function emailValidationMessage(raw: string): string | null {
  const s = raw.trim();
  if (s.length === 0) {
    return "Укажите email";
  }
  if (s.length > 254) {
    return "Слишком длинный адрес";
  }
  if (!isValidEmail(s)) {
    return "Некорректный формат email (ожидается вид: имя@домен.зона)";
  }
  return null;
}

/** Пароль для регистрации / входа: минимум 8 символов. */
export function passwordValidationMessage(pw: string, mode: "login" | "register"): string | null {
  if (pw.length === 0) {
    return "Введите пароль";
  }
  if (pw.length < 8) {
    return "Пароль не короче 8 символов";
  }
  if (mode === "register" && pw.length > 128) {
    return "Пароль слишком длинный";
  }
  return null;
}
