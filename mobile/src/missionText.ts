import type { StepPublic } from "./types";

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
    case "SEARCH_ENGINE_RESULTS":
      return "Перед вами учебная страница поиска: несколько сниппетов, как в выдаче. Нужно выбрать один результат по домену и заголовку.";
    case "NET_SHIELD_CONSOLE":
      return "Открыта консоль мониторинга периметра: таблица соединений. Действие — выбрать, какую сессию разорвать.";
    case "VIRUSTOTAL_LOOKUP":
      return "Учебный экран сводки VirusTotal по URL: дождитесь «анализа», прочитайте число детектов и выберите дальнейшее действие.";
    case "MOBILE_PHONE_INCIDENT":
      return "Экран телефона: лента SMS и поверх неё входящий звонок. Пролистайте шум, оцените звонок и выберите действие внизу.";
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

export function stepAnalysisText(step: StepPublic): string {
  const n = step.narrative?.trim() ?? "";
  if (n.length > 0) {
    return n;
  }
  return "Смотрите детали ниже и выберите ответ по условию.";
}
