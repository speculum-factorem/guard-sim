import type { StepPublic } from "./types";

/** Текст блока «Ситуация» слева: из сценария или типовой по типу UI. */
export function missionBriefText(step: StepPublic): string {
  const raw = step.situationBrief?.trim();
  if (raw) {
    return raw;
  }
  switch (step.uiKind) {
    case "EMAIL_CLIENT":
      return "Вы смотрите входящее письмо в почтовом клиенте. Ниже — то, что видно на экране: тема, отправитель и действия.";
    case "SOCIAL_NOTIFICATION":
      return "Открыта лента соцсети. Ниже — пост и элементы, как в мобильном или веб-интерфейсе.";
    case "DESK_TICKET":
      return "Открыт тикет в системе информационной безопасности. Ниже — описание и интерактивные элементы.";
    case "MINI_URL_COMPARE":
      return "Нужно оценить адреса так, как в браузере перед переходом. Ниже — два варианта и подсказки.";
    case "CHAT_MESSENGER":
      return "Открыт мессенджер: переписка и пересланное сообщение, как в рабочем чате.";
    case "CALENDAR_INVITE":
      return "На экране приглашение на встречу: тема, организатор, время и описание со ссылкой.";
    case "EXTENSION_STORE":
      return "Открыта карточка расширения в магазине: название, издатель, отзывы и запрашиваемые разрешения.";
    default:
      return "Прочитайте условие и выберите действие.";
  }
}

/** Текст задания для отображения в симуляции и в колонке «Материал»: не оставляем пустым. */
export function stepAnalysisText(step: StepPublic): string {
  const n = step.narrative?.trim() ?? "";
  if (n.length > 0) {
    return n;
  }
  /* Не дублируем блок «Ситуация»: при отсутствии narrative даём нейтральную отсылку к интерфейсу. */
  return "Смотрите детали в интерфейсе справа и выберите ответ по условию слева.";
}
