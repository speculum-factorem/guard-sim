export type DesktopVirusId = "process_parasite" | "file_worm" | "resource_hog" | "network_bot";

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
    subtitle: "Бесконечные всплывающие окна",
    difficulty: "средняя",
    description:
      "Поддельные окна появляются сами и накладываются друг на друга. Закрывать каждое необязательно.",
    goal: "Откройте «Пуск» → Антивирус и запустите режим «Антималварь». Не допустите слишком большой стопки окон.",
  },
  {
    id: "file_worm",
    name: "Файловый червь",
    subtitle: "Виртуальная файловая система",
    difficulty: "сложная",
    description:
      "Червь оставил полезную нагрузку и запись автозагрузки. Нужны проводник, антивирус и консоль.",
    goal:
      "1) Антивирус — полное сканирование (узнайте путь). 2) Проводник — удалите вредоносный файл по этому пути. 3) Консоль — удалите ключ автозагрузки командой из подсказки.",
  },
  {
    id: "resource_hog",
    name: "Пожиратель ресурсов",
    subtitle: "CPU и хвосты в системе",
    difficulty: "средняя",
    description: "Процесс перегружает процессор; после остановки остаются артефакты.",
    goal:
      "Диспетчер задач — завершите mshelper (копия). Затем в антивирусе — «Удалить остатки угрозы». В консоли выполните: purge-miner-traces",
  },
  {
    id: "network_bot",
    name: "Сетевой бот",
    subtitle: "Сеть и брандмауэр",
    difficulty: "сложная",
    description: "Исходящий трафик на подозрительные узлы; в диспетчере видна сетевая нагрузка.",
    goal:
      "Пуск → Диспетчер задач, вкладка «Сеть» — оцените нагрузку. Брандмауэр — заблокируйте все вредоносные IP, не трогая доверенные. Уложитесь в таймер.",
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
