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
