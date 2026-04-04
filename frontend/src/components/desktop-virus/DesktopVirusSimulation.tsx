import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DESKTOP_VIRUS_CATALOG,
  type DesktopVirusCatalogEntry,
  type DesktopVirusId,
} from "./desktopVirusCatalog";

type Phase = "playing" | "won" | "lost";

const WIN_IDS = ["explorer", "antivirus", "firewall", "console", "taskmgr"] as const;
type WinId = (typeof WIN_IDS)[number];

const WIN_LABELS: Record<WinId, { title: string; menu: string; taskbar: string }> = {
  explorer: { title: "Проводник", menu: "Проводник", taskbar: "Проводник" },
  antivirus: { title: "Антивирус GuardSim", menu: "Антивирус", taskbar: "Антивирус" },
  firewall: { title: "Брандмауэр", menu: "Брандмауэр", taskbar: "Брандмауэр" },
  console: { title: "Консоль", menu: "Консоль", taskbar: "Консоль" },
  taskmgr: { title: "Диспетчер задач", menu: "Диспетчер задач", taskbar: "Диспетчер" },
};

const WIN_LAYOUT: Record<WinId, { top: string; left: string; width: string }> = {
  explorer: { top: "8%", left: "4%", width: "min(440px, 90vw)" },
  antivirus: { top: "10%", left: "38%", width: "min(380px, 88vw)" },
  firewall: { top: "12%", left: "52%", width: "min(460px, 92vw)" },
  console: { top: "44%", left: "6%", width: "min(520px, 94vw)" },
  taskmgr: { top: "6%", left: "18%", width: "min(560px, 95vw)" },
};

const BAD_POPUP_TITLES = [
  "Срочно: обновите антивирус",
  "Ваш ПК заблокирован (МВД)",
  "Позвоните на горячую линию",
  "Криптокошелёк — подтвердите вход",
  "WIN_PRIZE_2026.exe",
  "Отсканируйте QR для разблокировки",
  "КРИТИЧНО: вирус обнаружен",
  "Платёж отклонён — войдите снова",
];

/** Виртуальные пути → содержимое каталога */
type FsEntry = { kind: "dir" } | { kind: "file"; malware?: boolean };

const WORM_VFS: Record<string, Record<string, FsEntry>> = {
  "C:": { Users: { kind: "dir" }, "Program Files": { kind: "dir" }, "Windows": { kind: "dir" } },
  "C:/Users": { Public: { kind: "dir" }, Maxim: { kind: "dir" } },
  "C:/Users/Public": { Downloads: { kind: "dir" }, Documents: { kind: "dir" } },
  "C:/Users/Public/Downloads": {
    "invoice.pdf.exe": { kind: "file", malware: true },
    "Quarter_Report.xlsx": { kind: "file" },
    "readme.txt": { kind: "file" },
  },
  "C:/Users/Public/Documents": { "notes.txt": { kind: "file" } },
  "C:/Users/Maxim": { Documents: { kind: "dir" } },
  "C:/Users/Maxim/Documents": { "draft.docx": { kind: "file" } },
  "C:/Program Files": { "GuardSim": { kind: "dir" } },
  "C:/Program Files/GuardSim": { "readme.txt": { kind: "file" } },
  "C:/Windows": { System32: { kind: "dir" } },
  "C:/Windows/System32": { "drivers": { kind: "dir" } },
  "C:/Windows/System32/drivers": { "etc_host": { kind: "file" } },
};

const WORM_MALWARE_PATH = "C:/Users/Public/Downloads/invoice.pdf.exe";
const WORM_REG_CMD = "reg delete WormBridge /f";

const NET_ROWS_BOT: { ip: string; label: string; bad: boolean }[] = [
  { ip: "185.234.72.19", label: "tor-exit / сканирование", bad: true },
  { ip: "91.224.90.3", label: "известный C2", bad: true },
  { ip: "203.0.113.44", label: "ботнет relay", bad: true },
  { ip: "198.51.100.9", label: "скан портов", bad: true },
  { ip: "1.1.1.1", label: "Cloudflare DNS", bad: false },
  { ip: "104.21.44.88", label: "CDN / доставка контента", bad: false },
  { ip: "8.8.8.8", label: "Google Public DNS", bad: false },
];

const TM_PROC_MINER = [
  { id: "sys", name: "System", cpu: 0.4, net: 0.01, malware: false },
  { id: "exp", name: "explorer.exe", cpu: 2.1, net: 0.05, malware: false },
  { id: "msedge", name: "msedge.exe", cpu: 8.4, net: 0.3, malware: false },
  { id: "bad", name: "mshelper (копия)", cpu: 89.0, net: 0.02, malware: true },
];

const TM_PROC_BOT = [
  { id: "sys", name: "System", cpu: 0.3, net: 0.0, malware: false },
  { id: "exp", name: "explorer.exe", cpu: 1.8, net: 0.04, malware: false },
  { id: "bot", name: "nt_botagent.exe", cpu: 12.0, net: 18.7, malware: true },
  { id: "svc", name: "svchost.exe", cpu: 3.2, net: 0.08, malware: false },
];

/** Процессы «обычного ПК» — снятие задачи убирает строку (симуляция) */
const TM_DECORATIVE: { id: string; name: string; cpu: number; net: number }[] = [
  { id: "dec-chrome", name: "chrome.exe", cpu: 4.8, net: 0.42 },
  { id: "dec-spotify", name: "Spotify.exe", cpu: 1.4, net: 0.11 },
  { id: "dec-steam", name: "steam.exe", cpu: 0.9, net: 0.15 },
  { id: "dec-dwm", name: "dwm.exe", cpu: 0.7, net: 0.0 },
  { id: "dec-teams", name: "ms-teams.exe", cpu: 2.2, net: 0.28 },
];

const WALLPAPER_VARIANTS = ["default", "aurora", "magma", "ocean", "neon-grid", "forest", "sunset"] as const;
type WallpaperId = (typeof WALLPAPER_VARIANTS)[number];

const CASUAL_VFS: Record<string, Record<string, FsEntry>> = {
  "C:": { Users: { kind: "dir" } },
  "C:/Users": { Maxim: { kind: "dir" } },
  "C:/Users/Maxim": {
    Desktop: { kind: "dir" },
    Documents: { kind: "dir" },
  },
  "C:/Users/Maxim/Documents": {
    "паспорт.pdf": { kind: "file" },
    "квитанции.xlsx": { kind: "file" },
  },
  "C:/Users/Maxim/Desktop": {
    Игры: { kind: "dir" },
    Скриншоты: { kind: "dir" },
    Работа: { kind: "dir" },
    "Заметки.txt": { kind: "file" },
  },
  "C:/Users/Maxim/Desktop/Игры": {
    Cyberpunk: { kind: "dir" },
    "Stardew Valley": { kind: "dir" },
  },
  "C:/Users/Maxim/Desktop/Игры/Cyberpunk": {
    "saves.zip": { kind: "file" },
  },
  "C:/Users/Maxim/Desktop/Игры/Stardew Valley": {
    "SMAPI.txt": { kind: "file" },
  },
  "C:/Users/Maxim/Desktop/Скриншоты": {
    "2026-04-01.png": { kind: "file" },
  },
  "C:/Users/Maxim/Desktop/Работа": {
    "идеи.md": { kind: "file" },
  },
};

const DESKTOP_ICONS: { id: string; label: string; emoji: string; open: WinId }[] = [
  { id: "i1", label: "Мои документы", emoji: "📁", open: "explorer" },
  { id: "i2", label: "Игры", emoji: "🎮", open: "explorer" },
  { id: "i3", label: "Браузер", emoji: "🌐", open: "explorer" },
  { id: "i4", label: "Музыка", emoji: "🎵", open: "explorer" },
  { id: "i5", label: "Корзина", emoji: "🗑", open: "explorer" },
  { id: "i6", label: "Защита", emoji: "🛡", open: "antivirus" },
];

function formatClock(d: Date): string {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function diffClass(d: DesktopVirusCatalogEntry["difficulty"]): string {
  if (d === "лёгкая") return "easy";
  if (d === "средняя") return "med";
  return "hard";
}

function useWindowManager() {
  const [open, setOpen] = useState<Record<WinId, boolean>>(() => ({
    explorer: false,
    antivirus: false,
    firewall: false,
    console: false,
    taskmgr: false,
  }));
  const [zStack, setZStack] = useState<WinId[]>([]);

  const openWindow = useCallback((id: WinId) => {
    setOpen((o) => ({ ...o, [id]: true }));
    setZStack((s) => [...s.filter((x) => x !== id), id]);
  }, []);

  const closeWindow = useCallback((id: WinId) => {
    setOpen((o) => ({ ...o, [id]: false }));
    setZStack((s) => s.filter((x) => x !== id));
  }, []);

  const bringToFront = useCallback((id: WinId) => {
    setZStack((s) => [...s.filter((x) => x !== id), id]);
  }, []);

  const zIndexFor = useCallback(
    (id: WinId) => {
      const i = zStack.indexOf(id);
      return i < 0 ? 12 : 20 + i;
    },
    [zStack],
  );

  const resetAllClosed = useCallback(() => {
    setOpen({
      explorer: false,
      antivirus: false,
      firewall: false,
      console: false,
      taskmgr: false,
    });
    setZStack([]);
  }, []);

  return {
    open,
    zStack,
    openWindow,
    closeWindow,
    bringToFront,
    zIndexFor,
    resetAllClosed,
  };
}

function DesktopWindowFrame(props: {
  winId: WinId;
  z: number;
  onClose: () => void;
  onPointerDown: () => void;
  children: ReactNode;
}) {
  const { winId, z, onClose, onPointerDown, children } = props;
  const L = WIN_LAYOUT[winId];
  return (
    <div
      className="dvs-window"
      style={{ top: L.top, left: L.left, width: L.width, zIndex: z }}
      onPointerDown={onPointerDown}
    >
      <div className="dvs-win-titlebar">
        <span className="dvs-win-title">{WIN_LABELS[winId].title}</span>
        <button type="button" className="dvs-win-close" aria-label="Закрыть" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="dvs-win-body">{children}</div>
    </div>
  );
}

function VirusSelectCard(props: { entry: DesktopVirusCatalogEntry; onPick: () => void }) {
  const { entry, onPick } = props;
  return (
    <button type="button" className="dvs-select-card" onClick={onPick}>
      <div className="dvs-select-card-top">
        <span className="dvs-select-card-name">{entry.name}</span>
        <span className={`dvs-select-diff dvs-select-diff--${diffClass(entry.difficulty)}`}>{entry.difficulty}</span>
      </div>
      <p className="dvs-select-card-sub">{entry.subtitle}</p>
      <p className="dvs-select-card-desc">{entry.description}</p>
      <span className="dvs-select-card-cta">Запустить симуляцию →</span>
    </button>
  );
}

export function DesktopVirusSimulation(props: { virusId: DesktopVirusId | null }) {
  const { virusId } = props;
  const navigate = useNavigate();

  if (!virusId) {
    return (
      <div className="dvs-page dvs-page--select">
        <div className="dvs-select-inner">
          <header className="dvs-select-header">
            <span className="dvs-select-badge">СИМУЛЯЦИЯ</span>
            <h1 className="dvs-select-title">Рабочий стол</h1>
            <p className="dvs-select-lead">
              Выберите один тип угрозы — на виртуальном столе нужно устранить именно её. Все действия вымышленные.
            </p>
          </header>
          <div className="dvs-select-grid">
            {DESKTOP_VIRUS_CATALOG.map((entry) => (
              <VirusSelectCard key={entry.id} entry={entry} onPick={() => navigate(`/desktop-virus/${entry.id}`)} />
            ))}
          </div>
          <p className="dvs-select-foot">
            <Link to="/dashboard" className="dvs-link-back">
              ← Назад в дашборд
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return <DesktopVirusGame virusId={virusId} />;
}

function DesktopVirusGame(props: { virusId: DesktopVirusId }) {
  const { virusId } = props;
  const entry = useMemo(() => DESKTOP_VIRUS_CATALOG.find((e) => e.id === virusId)!, [virusId]);
  const [clock, setClock] = useState(() => new Date());
  const [startOpen, setStartOpen] = useState(false);
  const startRef = useRef<HTMLDivElement>(null);
  const shell = useWindowManager();
  const [phase, setPhase] = useState<Phase>("playing");

  /* ── Уровень 1: паразит ── */
  const [p1Popups, setP1Popups] = useState<{ id: string; title: string; top: number; left: number; z: number }[]>([]);
  const p1IdRef = useRef(0);
  const p1ZRef = useRef(100);

  /* ── Уровень 2: червь ── */
  const [wormPath, setWormPath] = useState<string>("C:");
  const [wormSelected, setWormSelected] = useState<string | null>(null);
  const [wormScanDone, setWormScanDone] = useState(false);
  const [wormFileGone, setWormFileGone] = useState(false);
  const [wormRegDone, setWormRegDone] = useState(false);
  const [wormHiddenFile, setWormHiddenFile] = useState<string | null>(null);

  /* ── Уровень 4: майнер ── */
  const [rhKilled, setRhKilled] = useState(false);
  const [rhAv, setRhAv] = useState(false);
  const [rhConsole, setRhConsole] = useState(false);

  /* ── Уровень 5: ботнет ── */
  const [nbBlocked, setNbBlocked] = useState<Set<string>>(() => new Set());
  const [nbLeft, setNbLeft] = useState(90);

  const [tmTab, setTmTab] = useState<"proc" | "net">("proc");
  const [consoleLines, setConsoleLines] = useState<string[]>(["GuardSim Console v1.0", "Введите команду и нажмите Enter."]);
  const [consoleInput, setConsoleInput] = useState("");
  const [wallpaperId, setWallpaperId] = useState<WallpaperId>(
    () => WALLPAPER_VARIANTS[Math.floor(Math.random() * WALLPAPER_VARIANTS.length)]!,
  );
  const [decorativeKilled, setDecorativeKilled] = useState<Set<string>>(() => new Set());
  const [casualPath, setCasualPath] = useState("C:/Users/Maxim/Desktop");
  const [casualSelected, setCasualSelected] = useState<string | null>(null);

  useEffect(() => {
    shell.resetAllClosed();
    setPhase("playing");
    setStartOpen(false);
    setP1Popups([]);
    setWormPath("C:");
    setWormSelected(null);
    setWormScanDone(false);
    setWormFileGone(false);
    setWormRegDone(false);
    setRhKilled(false);
    setRhAv(false);
    setRhConsole(false);
    setNbBlocked(new Set());
    setNbLeft(90);
    setTmTab("proc");
    setWormHiddenFile(null);
    setWallpaperId(WALLPAPER_VARIANTS[Math.floor(Math.random() * WALLPAPER_VARIANTS.length)]!);
    setDecorativeKilled(new Set());
    setCasualPath("C:/Users/Maxim/Desktop");
    setCasualSelected(null);
    setConsoleLines(["GuardSim Console v1.0", "Введите команду и нажмите Enter."]);
    setConsoleInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- сброс при смене сценария
  }, [virusId]);

  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!startOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (startRef.current?.contains(e.target as Node)) return;
      setStartOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [startOpen]);

  /* Победа / поражение: червь */
  useEffect(() => {
    if (virusId !== "file_worm" || phase !== "playing") return;
    if (wormScanDone && wormFileGone && wormRegDone) setPhase("won");
  }, [virusId, phase, wormScanDone, wormFileGone, wormRegDone]);

  /* Победа / поражение: ресурсы */
  useEffect(() => {
    if (virusId !== "resource_hog" || phase !== "playing") return;
    if (rhKilled && rhAv && rhConsole) setPhase("won");
  }, [virusId, phase, rhKilled, rhAv, rhConsole]);

  /* Победа / поражение: сеть */
  const nbBadIps = useMemo(() => NET_ROWS_BOT.filter((r) => r.bad).map((r) => r.ip), []);
  const nbAllBadBlocked = nbBadIps.every((ip) => nbBlocked.has(ip));
  const nbGoodBlocked = NET_ROWS_BOT.some((r) => !r.bad && nbBlocked.has(r.ip));

  useEffect(() => {
    if (virusId !== "network_bot" || phase !== "playing") return;
    const t = window.setInterval(() => setNbLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [virusId, phase]);

  useEffect(() => {
    if (virusId !== "network_bot" || phase !== "playing") return;
    if (nbGoodBlocked) setPhase("lost");
  }, [virusId, phase, nbGoodBlocked]);

  useEffect(() => {
    if (virusId !== "network_bot" || phase !== "playing") return;
    if (nbAllBadBlocked && !nbGoodBlocked) setPhase("won");
  }, [virusId, phase, nbAllBadBlocked, nbGoodBlocked]);

  useEffect(() => {
    if (virusId !== "network_bot" || phase !== "playing") return;
    if (nbLeft === 0 && !nbAllBadBlocked) setPhase("lost");
  }, [virusId, phase, nbLeft, nbAllBadBlocked]);

  /* Уровень 1: бесконечные окна */
  useEffect(() => {
    if (virusId !== "process_parasite" || phase !== "playing") return;
    const tick = window.setInterval(() => {
      setP1Popups((p) => {
        if (p.length >= 22) {
          window.setTimeout(() => setPhase("lost"), 0);
          return p;
        }
        p1IdRef.current += 1;
        p1ZRef.current += 1;
        const title = BAD_POPUP_TITLES[Math.floor(Math.random() * BAD_POPUP_TITLES.length)]!;
        return [
          ...p,
          {
            id: `pop${p1IdRef.current}`,
            title,
            top: 5 + Math.random() * 55,
            left: 4 + Math.random() * 58,
            z: p1ZRef.current,
          },
        ];
      });
    }, 1600 + Math.random() * 1400);
    return () => window.clearInterval(tick);
  }, [virusId, phase]);

  const closeP1Popup = useCallback((id: string) => {
    setP1Popups((p) => p.filter((x) => x.id !== id));
  }, []);

  const runAntimalware = useCallback(() => {
    if (virusId === "process_parasite" && phase === "playing") setPhase("won");
  }, [virusId, phase]);

  const appendConsole = useCallback((line: string) => {
    setConsoleLines((l) => [...l.slice(-40), line]);
  }, []);

  const submitConsole = useCallback(() => {
    const raw = consoleInput.trim();
    if (!raw) return;
    setConsoleInput("");
    appendConsole(`> ${raw}`);

    const low = raw.replace(/\s+/g, " ").toLowerCase();
    if (low === "help" || low === "?") {
      const lines = ["Справка: help или ? — этот текст."];
      if (virusId === "file_worm") lines.push("Червь: после удаления вредоноса — reg delete WormBridge /f");
      if (virusId === "resource_hog") lines.push("Майнер: purge-miner-traces (сначала процесс, потом антивирус)");
      if (virusId === "process_parasite") lines.push("Паразит: лечение только через «Антималварь» в окне антивируса.");
      if (virusId === "network_bot") lines.push("Ботнет: блокируйте IP в брандмауэре, смотрите сеть в диспетчере.");
      appendConsole(lines.join(" "));
      return;
    }

    if (virusId === "file_worm" && phase === "playing") {
      const norm = raw.replace(/\s+/g, " ").toLowerCase();
      if (norm === WORM_REG_CMD.toLowerCase()) {
        if (!wormFileGone) {
          appendConsole("Ошибка: сначала удалите вредоносный файл из проводника.");
          return;
        }
        setWormRegDone(true);
        appendConsole("Ключ WormBridge удалён из реестра (симуляция).");
        return;
      }
      appendConsole("Неизвестная команда. Подсказка: reg delete WormBridge /f");
      return;
    }

    if (virusId === "resource_hog" && phase === "playing") {
      if (raw.trim().toLowerCase() === "purge-miner-traces") {
        if (!rhKilled) {
          appendConsole("Сначала завершите процесс mshelper (копия) в диспетчере задач.");
          return;
        }
        if (!rhAv) {
          appendConsole("Сначала удалите остатки угрозы в антивирусе.");
          return;
        }
        setRhConsole(true);
        appendConsole("Хвосты майнера очищены (симуляция).");
        return;
      }
      appendConsole("Неизвестная команда. Нужно: purge-miner-traces");
      return;
    }

    appendConsole(`Команда не используется в этом сценарии: ${raw}`);
  }, [appendConsole, consoleInput, phase, rhAv, rhKilled, virusId, wormFileGone]);

  const openFromStart = (id: WinId) => {
    shell.openWindow(id);
    shell.bringToFront(id);
    setStartOpen(false);
  };

  const wormEntries = WORM_VFS[wormPath];
  const wormParent = wormPath.includes("/") ? wormPath.slice(0, wormPath.lastIndexOf("/")) : null;
  const casualParent = casualPath.includes("/") ? casualPath.slice(0, casualPath.lastIndexOf("/")) : null;
  const casualEntries = CASUAL_VFS[casualPath];

  const endDecorativeTask = useCallback((id: string) => {
    setDecorativeKilled((prev) => new Set(prev).add(id));
  }, []);

  const decorVisible = TM_DECORATIVE.filter((r) => !decorativeKilled.has(r.id));

  const effectiveWormEntries = useMemo(() => {
    if (!wormEntries) return null;
    if (wormHiddenFile && wormPath === "C:/Users/Public/Downloads") {
      const o = { ...wormEntries };
      delete o[wormHiddenFile];
      return o;
    }
    return wormEntries;
  }, [wormEntries, wormHiddenFile, wormPath]);

  const deleteWormFileFixed = () => {
    if (virusId !== "file_worm" || phase !== "playing" || !wormSelected || !effectiveWormEntries) return;
    const ent = effectiveWormEntries[wormSelected];
    if (!ent || ent.kind !== "file") return;
    if (ent.malware) {
      if (!wormScanDone) {
        appendConsole("Проводник: сначала выполните полное сканирование в антивирусе.");
        return;
      }
      setWormFileGone(true);
      setWormHiddenFile("invoice.pdf.exe");
      setWormSelected(null);
      return;
    }
    setPhase("lost");
  };

  const endRhTask = (id: string) => {
    if (virusId !== "resource_hog" || phase !== "playing") return;
    const row = TM_PROC_MINER.find((r) => r.id === id);
    if (!row) return;
    if (row.malware) setRhKilled(true);
    else setPhase("lost");
  };

  const toggleNbBlock = (ip: string) => {
    if (virusId !== "network_bot" || phase !== "playing") return;
    setNbBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(ip)) next.delete(ip);
      else next.add(ip);
      return next;
    });
  };

  return (
    <div className="dvs-page dvs-page--game">
      <div className="dvs-game-chrome">
        <div className="dvs-game-brief">
          <h1 className="dvs-game-title">{entry.name}</h1>
          <p className="dvs-game-goal">{entry.goal}</p>
        </div>
        <Link to="/desktop-virus" className="dvs-game-exit">
          Сменить угрозу
        </Link>
      </div>
      <div className="dvs-desktop" aria-label="Симуляция рабочего стола">
        <div className={`dvs-wallpaper dvs-wallpaper--${wallpaperId}`} aria-hidden />

        <div className="dvs-desktop-icons">
          <div className="dvs-desktop-icons-inner">
            {DESKTOP_ICONS.map((ic) => (
              <button
                key={ic.id}
                type="button"
                className="dvs-desk-icon"
                title={`Открыть: ${ic.label}`}
                onClick={() => {
                  shell.openWindow(ic.open);
                  shell.bringToFront(ic.open);
                  if (ic.id === "i2") setCasualPath("C:/Users/Maxim/Desktop/Игры");
                  if (ic.id === "i1") setCasualPath("C:/Users/Maxim/Documents");
                }}
              >
                <span className="dvs-desk-icon-ico" aria-hidden>
                  {ic.emoji}
                </span>
                <span className="dvs-desk-icon-label">{ic.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Окна из Пуск */}
        {shell.open.explorer ? (
          <DesktopWindowFrame
            winId="explorer"
            z={shell.zIndexFor("explorer")}
            onClose={() => shell.closeWindow("explorer")}
            onPointerDown={() => shell.bringToFront("explorer")}
          >
            {virusId === "file_worm" ? (
              <>
                <p className="dvs-win-hint">Путь: {wormPath.replace(/\//g, "\\")}</p>
                <div className="dvs-explorer-bar">
                  {wormParent ? (
                    <button type="button" className="dvs-btn dvs-btn--small dvs-btn--ghost" onClick={() => { setWormPath(wormParent); setWormSelected(null); }}>
                      ↑ Вверх
                    </button>
                  ) : null}
                </div>
                <ul className="dvs-file-list">
                  {effectiveWormEntries &&
                    Object.entries(effectiveWormEntries).map(([name, e]) => (
                      <li key={name}>
                        {e.kind === "dir" ? (
                          <button
                            type="button"
                            className="dvs-file-row"
                            onClick={() => {
                              setWormPath(`${wormPath}/${name}`);
                              setWormSelected(null);
                            }}
                          >
                            <span className="dvs-file-ico" aria-hidden>
                              📁
                            </span>
                            {name}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`dvs-file-row${wormSelected === name ? " dvs-file-row--selected" : ""}`}
                            onClick={() => setWormSelected(name)}
                          >
                            <span className="dvs-file-ico" aria-hidden>
                              📄
                            </span>
                            {name}
                          </button>
                        )}
                      </li>
                    ))}
                </ul>
                <div className="dvs-toolbar">
                  <button type="button" className="dvs-btn dvs-btn--danger" disabled={!wormSelected} onClick={deleteWormFileFixed}>
                    Удалить
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="dvs-win-hint">Путь: {casualPath.replace(/\//g, "\\")}</p>
                <p className="dvs-explorer-deco-note">Файлы обычного пользователя (симуляция, не связаны с заданием).</p>
                <div className="dvs-explorer-bar">
                  {casualParent ? (
                    <button
                      type="button"
                      className="dvs-btn dvs-btn--small dvs-btn--ghost"
                      onClick={() => {
                        setCasualPath(casualParent);
                        setCasualSelected(null);
                      }}
                    >
                      ↑ Вверх
                    </button>
                  ) : null}
                </div>
                <ul className="dvs-file-list">
                  {casualEntries &&
                    Object.entries(casualEntries).map(([name, e]) => (
                      <li key={name}>
                        {e.kind === "dir" ? (
                          <button
                            type="button"
                            className="dvs-file-row"
                            onClick={() => {
                              setCasualPath(`${casualPath}/${name}`);
                              setCasualSelected(null);
                            }}
                          >
                            <span className="dvs-file-ico" aria-hidden>
                              📁
                            </span>
                            {name}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`dvs-file-row${casualSelected === name ? " dvs-file-row--selected" : ""}`}
                            onClick={() => setCasualSelected(name)}
                          >
                            <span className="dvs-file-ico" aria-hidden>
                              📄
                            </span>
                            {name}
                          </button>
                        )}
                      </li>
                    ))}
                </ul>
              </>
            )}
          </DesktopWindowFrame>
        ) : null}

        {shell.open.antivirus ? (
          <DesktopWindowFrame
            winId="antivirus"
            z={shell.zIndexFor("antivirus")}
            onClose={() => shell.closeWindow("antivirus")}
            onPointerDown={() => shell.bringToFront("antivirus")}
          >
            <div className="dvs-av-deco">
              <p className="dvs-av-deco-status">● Мониторинг в реальном времени: включён</p>
              <button
                type="button"
                className="dvs-btn dvs-btn--ghost dvs-btn--small"
                onClick={() => appendConsole("[Антивирус] Быстрая проверка завершена. Угроз не найдено.")}
              >
                Быстрая проверка
              </button>
            </div>
            {virusId === "process_parasite" ? (
              <div className="dvs-av-actions">
                <p className="dvs-win-hint">Рекомендуется лечение всплывающих угроз.</p>
                <button type="button" className="dvs-btn dvs-btn--primary" onClick={runAntimalware}>
                  Антималварь — лечение
                </button>
              </div>
            ) : null}
            {virusId === "file_worm" ? (
              <div className="dvs-av-actions">
                <p className="dvs-win-hint">Полное сканирование покажет путь к вредоносному файлу.</p>
                <button
                  type="button"
                  className="dvs-btn dvs-btn--primary"
                  disabled={wormScanDone}
                  onClick={() => {
                    setWormScanDone(true);
                    appendConsole(`[Антивирус] Обнаружено: ${WORM_MALWARE_PATH.replace(/\//g, "\\")}`);
                  }}
                >
                  Полное сканирование системы
                </button>
                {wormScanDone ? (
                  <p className="dvs-av-report">
                    <strong>Результат:</strong> {WORM_MALWARE_PATH.replace(/\//g, "\\")}
                  </p>
                ) : null}
              </div>
            ) : null}
            {virusId === "resource_hog" ? (
              <div className="dvs-av-actions">
                <p className="dvs-win-hint">После завершения процесса удалите остатки.</p>
                <button
                  type="button"
                  className="dvs-btn dvs-btn--primary"
                  disabled={!rhKilled || rhAv}
                  onClick={() => setRhAv(true)}
                >
                  Удалить остатки угрозы
                </button>
                {!rhKilled ? <p className="dvs-win-hint dvs-win-hint--small">Сначала завершите mshelper (копия) в диспетчере задач.</p> : null}
              </div>
            ) : null}
            {virusId === "network_bot" ? (
              <p className="dvs-win-hint">В этом сценарии главное — брандмауэр и диспетчер (вкладка «Сеть»). Сканирование не обязательно.</p>
            ) : null}
          </DesktopWindowFrame>
        ) : null}

        {shell.open.firewall ? (
          <DesktopWindowFrame
            winId="firewall"
            z={shell.zIndexFor("firewall")}
            onClose={() => shell.closeWindow("firewall")}
            onPointerDown={() => shell.bringToFront("firewall")}
          >
            <>
              <p className="dvs-win-hint">Профиль: частная сеть</p>
              <ul className="dvs-fw-deco-list">
                <li className="dvs-fw-deco-row">
                  <span>mDNS (UDP 5353)</span>
                  <span className="dvs-fw-deco-pill">разрешено</span>
                </li>
                <li className="dvs-fw-deco-row">
                  <span>Локальная подсеть 192.168.x.x</span>
                  <span className="dvs-fw-deco-pill">разрешено</span>
                </li>
                <li className="dvs-fw-deco-row">
                  <span>SMB входящий (445)</span>
                  <span className="dvs-fw-deco-pill">заблокировано</span>
                </li>
              </ul>
              {virusId === "network_bot" ? (
                <>
                  <p className="dvs-win-hint">Исходящие — задание. Заблокируйте только вредоносные узлы.</p>
                  <p className="dvs-fw-timer">
                    Осталось: <strong>{nbLeft}</strong> с
                  </p>
                  <ul className="dvs-fw-list">
                    {NET_ROWS_BOT.map((r) => (
                      <li key={r.ip} className="dvs-fw-row">
                        <div>
                          <code>{r.ip}</code>
                          <span className="dvs-fw-label">{r.label}</span>
                        </div>
                        <button
                          type="button"
                          className={`dvs-btn dvs-btn--small${nbBlocked.has(r.ip) ? " dvs-btn--blocked" : ""}`}
                          onClick={() => toggleNbBlock(r.ip)}
                        >
                          {nbBlocked.has(r.ip) ? "Разблокировать" : "Заблокировать"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="dvs-win-hint dvs-win-hint--small">Список внешних IP для блокировки доступен в сценарии «Сетевой бот».</p>
              )}
            </>
          </DesktopWindowFrame>
        ) : null}

        {shell.open.console ? (
          <DesktopWindowFrame
            winId="console"
            z={shell.zIndexFor("console")}
            onClose={() => shell.closeWindow("console")}
            onPointerDown={() => shell.bringToFront("console")}
          >
            <div className="dvs-console-out" role="log">
              {consoleLines.map((ln, i) => (
                <div key={`${i}-${ln.slice(0, 12)}`} className="dvs-console-line">
                  {ln}
                </div>
              ))}
            </div>
            <p className="dvs-win-hint dvs-win-hint--small">Введите help для подсказок по сценарию.</p>
            {virusId === "file_worm" ? (
              <p className="dvs-win-hint dvs-win-hint--small">После удаления файла: {WORM_REG_CMD}</p>
            ) : null}
            {virusId === "resource_hog" ? (
              <p className="dvs-win-hint dvs-win-hint--small">После удаления остатков в антивирусе введите: purge-miner-traces</p>
            ) : null}
            <form
              className="dvs-console-form"
              onSubmit={(e) => {
                e.preventDefault();
                submitConsole();
              }}
            >
              <span className="dvs-console-prompt" aria-hidden>
                {">"}
              </span>
              <input
                className="dvs-console-input"
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                placeholder="команда…"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className="dvs-btn dvs-btn--small">
                Enter
              </button>
            </form>
          </DesktopWindowFrame>
        ) : null}

        {shell.open.taskmgr ? (
          <DesktopWindowFrame
            winId="taskmgr"
            z={shell.zIndexFor("taskmgr")}
            onClose={() => shell.closeWindow("taskmgr")}
            onPointerDown={() => shell.bringToFront("taskmgr")}
          >
            <div className="dvs-tm-tabs">
              <button type="button" className={`dvs-tm-tab${tmTab === "proc" ? " dvs-tm-tab--on" : ""}`} onClick={() => setTmTab("proc")}>
                Процессы
              </button>
              <button type="button" className={`dvs-tm-tab${tmTab === "net" ? " dvs-tm-tab--on" : ""}`} onClick={() => setTmTab("net")}>
                Сеть
              </button>
            </div>
            {tmTab === "proc" && virusId === "resource_hog" ? (
              <table className="dvs-tm-table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>CPU %</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {TM_PROC_MINER.map((r) => (
                    <tr key={r.id} className={r.cpu > 50 ? "dvs-tm-hot" : ""}>
                      <td>{r.name}</td>
                      <td>{r.cpu.toFixed(1)}</td>
                      <td>
                        <button type="button" className="dvs-btn dvs-btn--small" onClick={() => endRhTask(r.id)}>
                          Снять задачу
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {tmTab === "proc" && virusId === "network_bot" ? (
              <table className="dvs-tm-table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>CPU %</th>
                    <th>Сеть Мбит/с</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {TM_PROC_BOT.map((r) => (
                    <tr key={r.id} className={r.cpu > 50 || r.net > 10 ? "dvs-tm-hot" : ""}>
                      <td>{r.name}</td>
                      <td>{r.cpu.toFixed(1)}</td>
                      <td>{r.net.toFixed(2)}</td>
                      <td>
                        <span className="dvs-tm-muted">—</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {tmTab === "proc" && virusId !== "resource_hog" && virusId !== "network_bot" ? (
              <table className="dvs-tm-table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>CPU %</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {decorVisible.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="dvs-tm-muted">
                        Нет активных пользовательских процессов в списке.
                      </td>
                    </tr>
                  ) : (
                    decorVisible.map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.cpu.toFixed(1)}</td>
                        <td>
                          <button type="button" className="dvs-btn dvs-btn--small" onClick={() => endDecorativeTask(r.id)}>
                            Снять задачу
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : null}
            {tmTab === "net" && virusId === "network_bot" ? (
              <>
                <p className="dvs-win-hint dvs-win-hint--small">Сетевая активность процессов (исходящий трафик).</p>
                <table className="dvs-tm-table">
                  <thead>
                    <tr>
                      <th>Процесс</th>
                      <th>Сеть ↑ Мбит/с</th>
                      <th>Подсказка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TM_PROC_BOT.map((r) => (
                      <tr key={`n-${r.id}`} className={r.net > 10 ? "dvs-tm-hot" : ""}>
                        <td>{r.name}</td>
                        <td>{r.net.toFixed(2)}</td>
                        <td className="dvs-tm-muted">{r.net > 10 ? "Подозрительная нагрузка" : "норма"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}
            {tmTab === "net" && virusId === "resource_hog" ? (
              <>
                <p className="dvs-win-hint dvs-win-hint--small">Сеть по процессам (симуляция).</p>
                <table className="dvs-tm-table">
                  <thead>
                    <tr>
                      <th>Процесс</th>
                      <th>Сеть Мбит/с</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TM_PROC_MINER.map((r) => (
                      <tr key={`rn-${r.id}`}>
                        <td>{r.name}</td>
                        <td>{r.net.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}
            {tmTab === "net" && virusId !== "network_bot" && virusId !== "resource_hog" ? (
              <>
                <p className="dvs-win-hint dvs-win-hint--small">Исходящий трафик по процессам.</p>
                <table className="dvs-tm-table">
                  <thead>
                    <tr>
                      <th>Процесс</th>
                      <th>Сеть Мбит/с</th>
                      <th>Примечание</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decorVisible.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="dvs-tm-muted">
                          Нет процессов в списке.
                        </td>
                      </tr>
                    ) : (
                      decorVisible.map((r) => (
                        <tr key={`nd-${r.id}`} className={r.net > 0.25 ? "dvs-tm-hot" : ""}>
                          <td>{r.name}</td>
                          <td>{r.net.toFixed(2)}</td>
                          <td className="dvs-tm-muted">{r.net > 0.25 ? "активность" : "тишина"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            ) : null}
          </DesktopWindowFrame>
        ) : null}

        {/* Паразит: всплывающие окна */}
        {virusId === "process_parasite" && phase === "playing"
          ? p1Popups.map((pop) => (
              <div
                key={pop.id}
                className="dvs-window dvs-window--popup dvs-window--threat"
                style={{ top: `${pop.top}%`, left: `${pop.left}%`, width: "min(280px, 82vw)", zIndex: pop.z }}
              >
                <div className="dvs-win-titlebar dvs-win-titlebar--alert">
                  <span className="dvs-win-title">{pop.title}</span>
                  <button type="button" className="dvs-win-close" aria-label="Закрыть" onClick={() => closeP1Popup(pop.id)}>
                    ×
                  </button>
                </div>
                <div className="dvs-win-body dvs-win-body--compact">
                  <p>Подозрительное окно (симуляция).</p>
                </div>
              </div>
            ))
          : null}

        {virusId === "process_parasite" && phase === "playing" ? (
          <div className="dvs-hud">
            <span>Всплывающих окон: {p1Popups.length} (лимит 22)</span>
          </div>
        ) : null}

        <footer className="dvs-taskbar" role="presentation">
          <div className="dvs-taskbar-start-cluster" ref={startRef}>
            <button
              type="button"
              className={`dvs-start-btn${startOpen ? " dvs-start-btn--open" : ""}`}
              aria-expanded={startOpen}
              aria-haspopup="menu"
              aria-label="Пуск"
              onClick={() => setStartOpen((o) => !o)}
            >
              ⧉
            </button>
            {startOpen ? (
              <div className="dvs-start-menu" role="menu">
                <div className="dvs-start-menu-title">Утилиты</div>
                {(WIN_IDS as readonly WinId[]).map((id) => (
                  <button key={id} type="button" className="dvs-start-item" role="menuitem" onClick={() => openFromStart(id)}>
                    {WIN_LABELS[id].menu}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="dvs-taskbar-apps">
            {(WIN_IDS as readonly WinId[]).filter((id) => shell.open[id]).map((id) => (
              <button key={id} type="button" className="dvs-task-pill" onClick={() => shell.bringToFront(id)}>
                {WIN_LABELS[id].taskbar}
              </button>
            ))}
          </div>
          <time className="dvs-taskbar-clock" dateTime={clock.toISOString()}>
            {formatClock(clock)}
          </time>
        </footer>
      </div>
      {phase !== "playing" ? <ResultOverlay phase={phase} /> : null}
    </div>
  );
}

function ResultOverlay(props: { phase: "won" | "lost" }) {
  const { phase } = props;
  const navigate = useNavigate();
  return (
    <div className="dvs-overlay" role="dialog" aria-modal aria-labelledby="dvs-result-title">
      <div className="dvs-overlay-card">
        <h2 id="dvs-result-title" className={phase === "won" ? "dvs-result-win" : "dvs-result-loss"}>
          {phase === "won" ? "Победа" : "Поражение"}
        </h2>
        <p className="dvs-overlay-text">
          {phase === "won"
            ? "Вы устранили угрозу на виртуальном рабочем столе."
            : "Сценарий завершился неудачей. Попробуйте другой подход или смените тип угрозы."}
        </p>
        <div className="dvs-overlay-actions">
          <button type="button" className="dvs-btn dvs-btn--primary" onClick={() => navigate("/desktop-virus", { replace: true })}>
            К выбору угрозы
          </button>
          <button type="button" className="dvs-btn dvs-btn--ghost" onClick={() => window.location.reload()}>
            Повторить
          </button>
        </div>
      </div>
    </div>
  );
}
