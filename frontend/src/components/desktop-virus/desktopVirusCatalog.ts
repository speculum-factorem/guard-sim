export type DesktopVirusId =
  | "process_parasite"
  | "file_worm"
  | "phishing_wave"
  | "resource_hog"
  | "network_bot";

export interface DesktopVirusCatalogEntry {
  id: DesktopVirusId;
  name: string;
  subtitle: string;
  difficulty: "лёгкая" | "средняя" | "сложная";
  description: string;
  goal: string;
}

export const DESKTOP_VIRUS_CATALOG: readonly DesktopVirusCatalogEntry[] = [
  {
    id: "process_parasite",
    name: "Паразит процессов",
    subtitle: "Поддельные окна и всплывающие угрозы",
    difficulty: "средняя",
    description:
      "Вирус спамит подозрительными окнами. Системные приложения трогать нельзя — закрывайте только вредоносные.",
    goal: "Закройте 6 вредоносных окон (крестиком). Не закрывайте «Системный проводник». Не дайте накопиться 12 угрозам сразу.",
  },
  {
    id: "file_worm",
    name: "Файловый червь",
    subtitle: "Подмена в папке «Загрузки»",
    difficulty: "лёгкая",
    description:
      "Среди файлов затесался один опасный объект с двойным расширением. Удалите только его.",
    goal: "Выделите вредоносный файл и нажмите «Удалить». Ошибочное удаление чистого файла — поражение.",
  },
  {
    id: "phishing_wave",
    name: "Волна фишинга",
    subtitle: "Уведомления в стиле ОС",
    difficulty: "средняя",
    description:
      "В центре уведомлений смешались фальшивые и настоящие сообщения безопасности.",
    goal:
      "На фишинге жмите «Пропустить». На легитимном — «Доверять». Три ошибки подряд — поражение.",
  },
  {
    id: "resource_hog",
    name: "Пожиратель ресурсов",
    subtitle: "Диспетчер задач",
    difficulty: "лёгкая",
    description: "Один процесс перегружает CPU. Завершите именно его.",
    goal: "Завершите задачу «mshelper (копия)». Не трогайте explorer.exe и System.",
  },
  {
    id: "network_bot",
    name: "Сетевой бот",
    subtitle: "Мини-брандмауэр",
    difficulty: "сложная",
    description:
      "Нужно заблокировать исходящие соединения на вредоносные адреса и не задеть доверенный CDN.",
    goal: "Заблокируйте оба вредоносных IP. Не блокируйте 1.1.1.1. Уложитесь в таймер.",
  },
] as const;

const IDS = new Set<string>(DESKTOP_VIRUS_CATALOG.map((e) => e.id));

export function isDesktopVirusId(raw: string | undefined): raw is DesktopVirusId {
  return raw != null && IDS.has(raw);
}

export function getDesktopVirusEntry(id: DesktopVirusId): DesktopVirusCatalogEntry {
  const e = DESKTOP_VIRUS_CATALOG.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown virus: ${id}`);
  return e;
}
