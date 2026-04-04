import { seedFromStepId } from "./simMicroUiHelpers";

export type MockMailRow = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  isTask: boolean;
};

/** Текст дополнительного письма (не подставлять вместо narrative шага) */
export function mockMailBodyForRow(row: MockMailRow): string {
  if (row.isTask) {
    return "";
  }
  return `Здравствуйте.\n\nЭто служебное письмо «${row.subject}». Демонстрационный текст для почтового клиента.\n\nС уважением,\nСлужба уведомлений`;
}

const MOCK_SENDERS = [
  { from: "IT Support <itsupport@company.local>", subject: "Плановое обновление VPN", snippet: "В субботу с 02:00 до 04:00…" },
  { from: "HR Portal <no-reply@hr.company.local>", subject: "Напоминание: опрос удовлетворённости", snippet: "Пройдите короткий опрос до пятницы…" },
  { from: "Рассылка <digest@news.tech>", subject: "Дайджест: ИБ за неделю", snippet: "Топ материалов о фишинге и MFA…" },
  { from: "Коллега <ivan.p@company.local>", subject: "Re: встреча в четверг", snippet: "Ок, перенесём на 15:00…" },
  { from: "Security <alerts@soc.local>", subject: "[LOW] Необычный вход в аккаунт", snippet: "Новый браузер, та же геолокация…" },
] as const;

export function mockInboxRows(stepId: string, taskFrom: string, taskSubject: string): MockMailRow[] {
  const s = seedFromStepId(stepId);
  const taskId = `task-${stepId}`;
  const taskRow: MockMailRow = {
    id: taskId,
    from: taskFrom,
    subject: taskSubject,
    snippet: "См. условие слева…",
    isTask: true,
  };
  const others: MockMailRow[] = MOCK_SENDERS.map((m, i) => ({
    id: `mock-${stepId}-${i}`,
    from: m.from,
    subject: m.subject,
    snippet: m.snippet,
    isTask: false,
  }));
  const order = [...others];
  const insertAt = s % (order.length + 1);
  order.splice(insertAt, 0, taskRow);
  return order;
}

export function mockFolderRows(folderId: string, stepId: string): MockMailRow[] {
  const s = seedFromStepId(`${folderId}-${stepId}`);
  const base = [
    { from: "Архив <archive@local>", subject: "Старое уведомление", snippet: "Автоочистка через 30 дней…" },
    { from: "Система <mailer-daemon@>", subject: "Доставка не удалась", snippet: "550 Mailbox unavailable…" },
  ];
  return base.map((m, i) => ({
    id: `fold-${folderId}-${s}-${i}`,
    from: m.from,
    subject: `${m.subject} (${folderId})`,
    snippet: m.snippet,
    isTask: false,
  }));
}

export type MockSocialFriend = { id: string; name: string; subtitle: string };

export function mockSocialFriends(stepId: string): MockSocialFriend[] {
  const s = seedFromStepId(stepId);
  const names: [string, string][] = [
    ["Алексей В.", "Общие группы: 2"],
    ["Команда ИБ", "Страница организации"],
    ["Марина К.", `${3 + (s % 5)} общих друга`],
    ["Дайджест новостей", "Подписка"],
  ];
  return names.map((n, i) => ({
    id: `fr-${stepId}-${i}`,
    name: n[0],
    subtitle: n[1],
  }));
}

export type MockSavedPost = { id: string; title: string; meta: string };

export function mockSavedPosts(stepId: string): MockSavedPost[] {
  return [
    { id: `sv-${stepId}-1`, title: "Чек-лист перед кликом по ссылке", meta: "Сохранено 2 дня назад" },
    { id: `sv-${stepId}-2`, title: "Корпоративная политика паролей", meta: "Из базы знаний" },
    { id: `sv-${stepId}-3`, title: "Разбор кейса: поддельный CFO", meta: "Вебинар · 45 мин" },
  ];
}

export type MockTicketActivity = { id: string; who: string; when: string; text: string };

export function mockTicketActivity(stepId: string): MockTicketActivity[] {
  const s = seedFromStepId(stepId);
  return [
    { id: `a1-${stepId}`, who: "Система", when: "сегодня, 09:12", text: "Тикет создан из очереди email-security." },
    { id: `a2-${stepId}`, who: "Марина (ИБ)", when: "сегодня, 09:40", text: `Приоритет P${(s % 3) + 2} — проверить домен отправителя.` },
    { id: `a3-${stepId}`, who: "Бот", when: "сегодня, 09:41", text: "SLA отсчёт запущен (учебные данные)." },
  ];
}

export type MockGenericFile = { id: string; label: string; hint: string };

export function mockGenericAttachments(stepId: string): MockGenericFile[] {
  return [
    { id: `gf-${stepId}-1`, label: "policy-2024.pdf", hint: "Корпоративная политика ИБ" },
    { id: `gf-${stepId}-2`, label: "incidents-q3.xlsx", hint: "Выгрузка инцидентов" },
    { id: `gf-${stepId}-3`, label: "readme.txt", hint: "Памятка пользователя" },
  ];
}

export type MockBookmark = { label: string; url: string };

export function mockBrowserBookmarks(leftUrl: string, rightUrl: string, caption: string): MockBookmark[] {
  return [
    { label: "Корп. портал", url: "https://intranet.company.local/" },
    { label: "Вариант A", url: leftUrl },
    { label: "Вариант B", url: rightUrl },
    { label: "Справка", url: `https://guardsim.local/help?q=${encodeURIComponent(caption.slice(0, 20))}` },
  ];
}
