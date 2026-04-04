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
  return `Здравствуйте.\n\nЭто автоматическое уведомление по теме «${row.subject}». Текст приведён для заполнения почтового ящика.\n\nС уважением,\nСлужба уведомлений`;
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
    snippet: "Требуется ваша реакция по заданию",
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
    { from: "Система <mailer-daemon@>", subject: "Письмо не доставлено", snippet: "Ящик получателя недоступен…" },
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
    { id: `a1-${stepId}`, who: "Система", when: "сегодня, 09:12", text: "Обращение зарегистрировано, очередь мониторинга почты." },
    { id: `a2-${stepId}`, who: "Марина (ИБ)", when: "сегодня, 09:40", text: `Приоритет P${(s % 3) + 2} — проверить домен и подпись отправителя.` },
    { id: `a3-${stepId}`, who: "Бот", when: "сегодня, 09:41", text: "Таймер ответа по регламенту запущен." },
  ];
}

export type MockFeedDecorPost = {
  id: string;
  author: string;
  initials: string;
  timeMeta: string;
  preview: string;
  dialogTitle: string;
  dialogBody: string;
};

const FEED_DECOR_POSTS: Omit<MockFeedDecorPost, "id">[] = [
  {
    author: "Соседский чат",
    initials: "С",
    timeMeta: "вчера · 2 комментария",
    preview: "Кто-нибудь видел объявление про розыгрыш техники? Ссылка ведёт на страницу без названия…",
    dialogTitle: "Пост из соседского чата",
    dialogBody:
      "Обычная публикация в ленте. На проверку влияет только пост с кнопками ответа под заданием — он выделен в ленте отдельно.",
  },
  {
    author: "Доставка за час",
    initials: "Д",
    timeMeta: "3 ч назад · реклама",
    preview: "Скидка 90% на премиум — успейте оформить до полуночи! Нажмите и получите подарок.",
    dialogTitle: "Рекламный пост",
    dialogBody:
      "Такие карточки часто встречаются в ленте. Ваша задача описана в другом посте — с тем текстом, что дан в условии, и с вариантами действий.",
  },
  {
    author: "Новости района",
    initials: "Н",
    timeMeta: "5 ч назад",
    preview: "Сегодня перекроют улицу Ленина с 10:00 до 14:00. Парковка у школы временно закрыта.",
    dialogTitle: "Новости",
    dialogBody: "Локальная заметка без отношения к заданию. Ответ выбирайте в карточке с условием сценария.",
  },
  {
    author: "Мама в декрете ☕",
    initials: "М",
    timeMeta: "вчера",
    preview: "Поделитесь проверенными мастерами по ремонту? Нужен электрик, желательно с отзывами.",
    dialogTitle: "Пост в группе",
    dialogBody: "Обычное обсуждение. Задание с оценкой — только в отдельной карточке ниже или выше в этой ленте.",
  },
];

export function mockFeedDecorPosts(stepId: string): [MockFeedDecorPost, MockFeedDecorPost] {
  const s = seedFromStepId(`feed-${stepId}`);
  const a = s % FEED_DECOR_POSTS.length;
  let b = (s + 2) % FEED_DECOR_POSTS.length;
  if (b === a) {
    b = (b + 1) % FEED_DECOR_POSTS.length;
  }
  const top: MockFeedDecorPost = { ...FEED_DECOR_POSTS[a]!, id: `feed-decor-${stepId}-a` };
  const bottom: MockFeedDecorPost = { ...FEED_DECOR_POSTS[b]!, id: `feed-decor-${stepId}-b` };
  return [top, bottom];
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
