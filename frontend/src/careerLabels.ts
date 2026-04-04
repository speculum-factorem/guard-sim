import type { CareerRole } from "./types";

export function careerTitle(role: CareerRole): string {
  if (role === "INTERN") {
    return "Стажёр";
  }
  if (role === "EMPLOYEE") {
    return "Сотрудник";
  }
  return "Администратор безопасности";
}

export function careerDescription(role: CareerRole): string {
  if (role === "INTERN") {
    return "Начальный уровень: вы учитесь распознавать угрозы и действовать по инструкции.";
  }
  if (role === "EMPLOYEE") {
    return "Базовая ответственность за кибергигиену и реакцию на типовые инциденты в команде.";
  }
  return "Расширенные полномочия: приоритет в сценариях безопасности и репутация организации.";
}
