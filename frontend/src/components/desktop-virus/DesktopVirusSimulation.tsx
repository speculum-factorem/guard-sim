import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DESKTOP_VIRUS_CATALOG,
  type DesktopVirusCatalogEntry,
  type DesktopVirusId,
} from "./desktopVirusCatalog";

type Phase = "playing" | "won" | "lost";

type ParasitePopup = {
  id: string;
  title: string;
  top: number;
  left: number;
  z: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
  fullscreen: boolean;
};

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
  explorer: { top: "10%", left: "14%", width: "min(440px, 90vw)" },
  antivirus: { top: "12%", left: "42%", width: "min(380px, 88vw)" },
  firewall: { top: "14%", left: "56%", width: "min(460px, 92vw)" },
  console: { top: "46%", left: "16%", width: "min(520px, 94vw)" },
  taskmgr: { top: "8%", left: "26%", width: "min(560px, 95vw)" },
};

/** Позиция и размер в % от .dvs-desktop (как в оконном менеджере) */
type WinGeom = { top: number; left: number; w: number; h: number };

type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function parseLayoutPct(s: string): number {
  return parseFloat(String(s).replace("%", "").trim()) || 0;
}

function clampNum(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

const WIN_DEFAULT_WH: Record<WinId, { w: number; h: number }> = {
  explorer: { w: 36, h: 50 },
  antivirus: { w: 30, h: 44 },
  firewall: { w: 34, h: 48 },
  console: { w: 42, h: 40 },
  taskmgr: { w: 46, h: 54 },
};

const WIN_GEOM_INITIAL: Record<WinId, WinGeom> = (WIN_IDS as readonly WinId[]).reduce(
  (acc, id) => {
    const L = WIN_LAYOUT[id];
    const wh = WIN_DEFAULT_WH[id];
    acc[id] = { top: parseLayoutPct(L.top), left: parseLayoutPct(L.left), w: wh.w, h: wh.h };
    return acc;
  },
  {} as Record<WinId, WinGeom>,
);

function emptyWinRecord<T>(v: T): Record<WinId, T> {
  return (WIN_IDS as readonly WinId[]).reduce((acc, id) => {
    acc[id] = v;
    return acc;
  }, {} as Record<WinId, T>);
}

function DockIconGlyph(props: { winId: WinId; className?: string }) {
  const { winId, className } = props;
  const cn = `dvs-dock-glyph${className ? ` ${className}` : ""}`;
  switch (winId) {
    case "explorer":
      return (
        <svg className={cn} viewBox="0 0 48 48" width="28" height="28" aria-hidden>
          <rect x="6" y="10" width="36" height="26" rx="3" fill="#e8b44c" stroke="#c98f2b" strokeWidth="1.2" />
          <path d="M6 16h14l4-4h22v24H6V16z" fill="#f5d07a" />
        </svg>
      );
    case "antivirus":
      return (
        <svg className={cn} viewBox="0 0 48 48" width="28" height="28" aria-hidden>
          <path d="M24 4 L40 10 V22c0 12-8 18-16 22-8-4-16-10-16-22V10L24 4z" fill="#4a90d9" stroke="#2d6bb5" strokeWidth="1.2" />
          <path d="M17 22l5 5 10-12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "firewall":
      return (
        <svg className={cn} viewBox="0 0 48 48" width="28" height="28" aria-hidden>
          <rect x="10" y="8" width="28" height="32" rx="2" fill="#c0392b" />
          <rect x="14" y="14" width="8" height="8" fill="#fadbd8" opacity="0.9" />
          <rect x="26" y="14" width="8" height="8" fill="#fadbd8" opacity="0.9" />
          <rect x="14" y="26" width="8" height="8" fill="#fadbd8" opacity="0.9" />
          <rect x="26" y="26" width="8" height="8" fill="#fadbd8" opacity="0.9" />
        </svg>
      );
    case "console":
      return (
        <svg className={cn} viewBox="0 0 48 48" width="28" height="28" aria-hidden>
          <rect x="6" y="8" width="36" height="32" rx="3" fill="#2c001e" />
          <path d="M12 18l6 6-6 6M22 30h12" stroke="#aea79f" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "taskmgr":
      return (
        <svg className={cn} viewBox="0 0 48 48" width="28" height="28" aria-hidden>
          <rect x="8" y="10" width="32" height="28" rx="2" fill="#fdfdfd" stroke="#c4c4c4" strokeWidth="1" />
          <path d="M12 28V20l6 5 6-8 8 10v1H12z" fill="#772953" opacity="0.85" />
        </svg>
      );
    default:
      return null;
  }
}

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

function formatTopBarClock(d: Date): string {
  return d.toLocaleString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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

/** Как в Ubuntu (слева): закрыть, свернуть, развернуть / восстановить */
function GnomeCaptionButtons(props: {
  onClose: () => void;
  onMinimize: () => void;
  onMaximizeClick: (e: React.MouseEvent) => void;
  theme?: "light" | "dark";
  isRestored: boolean;
}) {
  const { onClose, onMinimize, onMaximizeClick, theme = "light", isRestored } = props;
  const capMax = `dvs-win-cap dvs-win-cap--max${isRestored ? "" : " dvs-win-cap--max-tiled"}`;
  return (
    <div className={`dvs-win-caps dvs-win-caps--yaru dvs-win-caps--gnome${theme === "dark" ? " dvs-win-caps--dark" : ""}`}>
      <button
        type="button"
        className="dvs-win-cap dvs-win-cap--close"
        aria-label="Закрыть"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onClose}
      />
      <button
        type="button"
        className="dvs-win-cap dvs-win-cap--min"
        aria-label="Свернуть"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onMinimize}
      />
      <button
        type="button"
        className={capMax}
        title="Развернуть (Shift — на весь экран симуляции)"
        aria-label={isRestored ? "Развернуть" : "Восстановить"}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onMaximizeClick}
      />
    </div>
  );
}

const RESIZE_EDGES: ResizeEdge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

function WindowResizeHandles(props: { onResizeStart: (edge: ResizeEdge, e: React.MouseEvent) => void }) {
  const { onResizeStart } = props;
  return (
    <>
      {RESIZE_EDGES.map((edge) => (
        <div
          key={edge}
          className={`dvs-win-resize dvs-win-resize--${edge}`}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onResizeStart(edge, e);
          }}
        />
      ))}
    </>
  );
}

/** Сетка «Показать приложения» в духе Ubuntu Dock */
function UbuntuShowAppsIcon() {
  return (
    <svg className="dvs-ubuntu-apps-svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((col) => (
          <circle key={`${row}-${col}`} cx={6 + col * 6} cy={6 + row * 6} r="1.85" fill="currentColor" />
        )),
      )}
    </svg>
  );
}

function DesktopWindowFrame(props: {
  winId: WinId;
  z: number;
  geom: WinGeom;
  minimized: boolean;
  maximized: boolean;
  fullscreen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximizeClick: (e: React.MouseEvent) => void;
  onPointerDown: () => void;
  onTitleMouseDown: (e: React.MouseEvent) => void;
  onTitleDoubleClick: (e: React.MouseEvent) => void;
  onResizeStart: (edge: ResizeEdge, e: React.MouseEvent) => void;
  children: ReactNode;
  chrome?: "app" | "terminal";
}) {
  const {
    winId,
    z,
    geom,
    minimized,
    maximized,
    fullscreen,
    onClose,
    onMinimize,
    onMaximizeClick,
    onPointerDown,
    onTitleMouseDown,
    onTitleDoubleClick,
    onResizeStart,
    children,
    chrome = "app",
  } = props;
  const isTerm = chrome === "terminal";
  const tiled = maximized || fullscreen;
  const isRestored = !maximized && !fullscreen;

  if (minimized) return null;

  return (
    <div
      className={`dvs-window dvs-window--os dvs-window--ubuntu${isTerm ? " dvs-window--terminal" : ""}${tiled ? " dvs-window--tiled" : ""}${maximized ? " dvs-window--maximized" : ""}${fullscreen ? " dvs-window--fullscreen" : ""}`}
      style={
        tiled
          ? { zIndex: z }
          : {
              top: `${geom.top}%`,
              left: `${geom.left}%`,
              width: `${geom.w}%`,
              height: `${geom.h}%`,
              zIndex: z,
            }
      }
      onPointerDown={onPointerDown}
    >
      {!tiled ? <WindowResizeHandles onResizeStart={onResizeStart} /> : null}
      <div
        className={`dvs-win-titlebar dvs-win-titlebar--gnome${isTerm ? " dvs-win-titlebar--terminal dvs-win-titlebar--ubuntu-term" : " dvs-win-titlebar--ubuntu"}${tiled ? " dvs-win-titlebar--tiled" : ""}`}
        onMouseDown={onTitleMouseDown}
        onDoubleClick={onTitleDoubleClick}
      >
        <GnomeCaptionButtons
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximizeClick={onMaximizeClick}
          theme={isTerm ? "dark" : "light"}
          isRestored={isRestored}
        />
        <span className="dvs-win-title dvs-win-title--gnome">{WIN_LABELS[winId].title}</span>
        <span className="dvs-win-titlebar-spacer" aria-hidden />
      </div>
      <div className={`dvs-win-body${isTerm ? " dvs-win-body--terminal" : ""}`}>{children}</div>
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
  const desktopRef = useRef<HTMLDivElement>(null);
  const [winGeom, setWinGeom] = useState<Record<WinId, WinGeom>>(() => ({ ...WIN_GEOM_INITIAL }));
  const winGeomRef = useRef(winGeom);
  const [minimized, setMinimized] = useState<Record<WinId, boolean>>(() => emptyWinRecord(false));
  const [maximized, setMaximized] = useState<Record<WinId, boolean>>(() => emptyWinRecord(false));
  const [fullscreen, setFullscreen] = useState<Record<WinId, boolean>>(() => emptyWinRecord(false));
  const maximizedRef = useRef(maximized);
  const fullscreenRef = useRef(fullscreen);
  const savedGeomRef = useRef<Partial<Record<WinId, WinGeom>>>({});
  const winDragRef = useRef<null | {
    id: WinId;
    sx: number;
    sy: number;
    ot: number;
    ol: number;
    dw: number;
    dh: number;
  }>(null);
  const resizeRef = useRef<null | {
    id: WinId;
    edge: ResizeEdge;
    sx: number;
    sy: number;
    g: WinGeom;
    dw: number;
    dh: number;
  }>(null);
  const [rubberBox, setRubberBox] = useState<null | { x: number; y: number; w: number; h: number }>(null);
  const rubberOriginRef = useRef<null | { ox: number; oy: number }>(null);
  const shell = useWindowManager();
  const [phase, setPhase] = useState<Phase>("playing");

  /* ── Уровень 1: паразит ── */
  const [p1Popups, setP1Popups] = useState<ParasitePopup[]>([]);
  const p1PopupsRef = useRef(p1Popups);
  useEffect(() => {
    p1PopupsRef.current = p1Popups;
  }, [p1Popups]);

  const p1ResizeRef = useRef<null | {
    popId: string;
    edge: ResizeEdge;
    sx: number;
    sy: number;
    g: WinGeom;
    dw: number;
    dh: number;
  }>(null);
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
  /** Синхронно для submitConsole — избегаем гонки после клика «Удалить остатки» и сразу Enter */
  const rhKilledRef = useRef(false);
  const rhAvRef = useRef(false);
  useEffect(() => {
    rhKilledRef.current = rhKilled;
  }, [rhKilled]);
  useEffect(() => {
    rhAvRef.current = rhAv;
  }, [rhAv]);

  useEffect(() => {
    winGeomRef.current = winGeom;
  }, [winGeom]);

  useEffect(() => {
    maximizedRef.current = maximized;
  }, [maximized]);

  useEffect(() => {
    fullscreenRef.current = fullscreen;
  }, [fullscreen]);

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
    rhKilledRef.current = false;
    rhAvRef.current = false;
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
    setWinGeom({ ...WIN_GEOM_INITIAL });
    setMinimized(emptyWinRecord(false));
    setMaximized(emptyWinRecord(false));
    setFullscreen(emptyWinRecord(false));
    savedGeomRef.current = {};
    setRubberBox(null);
    rubberOriginRef.current = null;
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
            w: 26,
            h: 22,
            minimized: false,
            maximized: false,
            fullscreen: false,
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
      const cmd = raw.replace(/\s+/g, " ").trim().toLowerCase();
      if (cmd === "purge-miner-traces") {
        if (!rhKilledRef.current) {
          appendConsole("Сначала завершите процесс mshelper (копия) в диспетчере задач.");
          return;
        }
        if (!rhAvRef.current) {
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
  }, [appendConsole, consoleInput, phase, virusId, wormFileGone]);

  const openFromStart = (id: WinId) => {
    shell.openWindow(id);
    shell.bringToFront(id);
    setMinimized((m) => ({ ...m, [id]: false }));
    setStartOpen(false);
  };

  const activateFromDock = (id: WinId) => {
    if (!shell.open[id]) shell.openWindow(id);
    shell.bringToFront(id);
    setMinimized((m) => ({ ...m, [id]: false }));
  };

  const toggleMaximizeWin = useCallback((id: WinId) => {
    if (fullscreenRef.current[id]) {
      setFullscreen((f) => ({ ...f, [id]: false }));
      const s = savedGeomRef.current[id];
      if (s) {
        setWinGeom((g) => ({ ...g, [id]: { ...s } }));
        winGeomRef.current = { ...winGeomRef.current, [id]: { ...s } };
      }
      return;
    }
    if (maximizedRef.current[id]) {
      setMaximized((m) => ({ ...m, [id]: false }));
      const s = savedGeomRef.current[id];
      if (s) {
        setWinGeom((g) => ({ ...g, [id]: { ...s } }));
        winGeomRef.current = { ...winGeomRef.current, [id]: { ...s } };
      }
      return;
    }
    savedGeomRef.current[id] = { ...winGeomRef.current[id] };
    setMaximized((m) => ({ ...m, [id]: true }));
  }, []);

  const toggleFullscreenWin = useCallback((id: WinId) => {
    if (fullscreenRef.current[id]) {
      setFullscreen((f) => ({ ...f, [id]: false }));
      const s = savedGeomRef.current[id];
      if (s) {
        setWinGeom((g) => ({ ...g, [id]: { ...s } }));
        winGeomRef.current = { ...winGeomRef.current, [id]: { ...s } };
      }
      setMaximized((m) => ({ ...m, [id]: false }));
      return;
    }
    if (!maximizedRef.current[id]) {
      savedGeomRef.current[id] = { ...winGeomRef.current[id] };
    }
    setMaximized((m) => ({ ...m, [id]: false }));
    setFullscreen((f) => ({ ...f, [id]: true }));
  }, []);

  const onWinMaxClick = useCallback(
    (id: WinId, e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey) toggleFullscreenWin(id);
      else toggleMaximizeWin(id);
    },
    [toggleFullscreenWin, toggleMaximizeWin],
  );

  const onWinMinimize = useCallback((id: WinId) => {
    setMinimized((m) => ({ ...m, [id]: true }));
  }, []);

  const closeWin = useCallback(
    (id: WinId) => {
      shell.closeWindow(id);
      setMinimized((m) => ({ ...m, [id]: false }));
      setMaximized((m) => ({ ...m, [id]: false }));
      setFullscreen((f) => ({ ...f, [id]: false }));
      delete savedGeomRef.current[id];
    },
    [shell],
  );

  const winZ = useCallback(
    (id: WinId) => (fullscreen[id] ? Math.max(580, shell.zIndexFor(id)) : shell.zIndexFor(id)),
    [fullscreen, shell],
  );

  const onTitleDblClick = useCallback(
    (id: WinId, e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      toggleMaximizeWin(id);
    },
    [toggleMaximizeWin],
  );

  const handleResizeStart = useCallback(
    (id: WinId, edge: ResizeEdge, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const desk = desktopRef.current;
      if (!desk) return;
      const dr = desk.getBoundingClientRect();
      resizeRef.current = {
        id,
        edge,
        sx: e.clientX,
        sy: e.clientY,
        g: { ...winGeomRef.current[id] },
        dw: Math.max(1, dr.width),
        dh: Math.max(1, dr.height),
      };
      shell.bringToFront(id);
      document.body.style.userSelect = "none";

      const minW = 18;
      const minH = 15;

      const onMove = (ev: MouseEvent) => {
        const d = resizeRef.current;
        if (!d) return;
        const dx = ((ev.clientX - d.sx) / d.dw) * 100;
        const dy = ((ev.clientY - d.sy) / d.dh) * 100;
        const { g, edge: ed } = d;
        let { top, left, w, h } = g;

        if (ed.includes("e")) w = clampNum(g.w + dx, minW, 100 - left);
        if (ed.includes("s")) h = clampNum(g.h + dy, minH, 100 - top);
        if (ed.includes("w")) {
          const nw = clampNum(g.w - dx, minW, g.left + g.w);
          left = g.left + g.w - nw;
          w = nw;
        }
        if (ed.includes("n")) {
          const nh = clampNum(g.h - dy, minH, g.top + g.h);
          top = g.top + g.h - nh;
          h = nh;
        }

        left = clampNum(left, 0, 100 - w);
        top = clampNum(top, 0, 100 - h);
        if (left + w > 100) w = 100 - left;
        if (top + h > 100) h = 100 - top;

        setWinGeom((prev) => {
          const next = { ...prev, [d.id]: { top, left, w, h } };
          winGeomRef.current = next;
          return next;
        });
      };
      const onUp = () => {
        resizeRef.current = null;
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [shell],
  );

  const handleWinTitleMouseDown = useCallback(
    (id: WinId, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button")) return;
      const desk = desktopRef.current;
      if (!desk) return;
      e.preventDefault();
      const dr = desk.getBoundingClientRect();
      const dw = Math.max(1, dr.width);
      const dh = Math.max(1, dr.height);

      const startX = e.clientX;
      const startY = e.clientY;
      let dragActive = false;
      let geom = { ...winGeomRef.current[id] };
      const wasTiled = fullscreenRef.current[id] || maximizedRef.current[id];

      const applyUntileAtPointer = () => {
        const saved = savedGeomRef.current[id] ?? geom;
        const nl = ((startX - e.nativeEvent.offsetX) - dr.left) / dw * 100;
        const nt = ((startY - e.nativeEvent.offsetY) - dr.top) / dh * 100;
        geom = {
          ...saved,
          left: clampNum(nl, 0, 100 - saved.w),
          top: clampNum(nt, 0, 100 - saved.h),
        };
        setFullscreen((f) => ({ ...f, [id]: false }));
        setMaximized((m) => ({ ...m, [id]: false }));
        setWinGeom((g) => ({ ...g, [id]: geom }));
        winGeomRef.current = { ...winGeomRef.current, [id]: geom };
      };

      shell.bringToFront(id);

      const onMove = (ev: MouseEvent) => {
        if (!dragActive) {
          if (Math.abs(ev.clientX - startX) < 5 && Math.abs(ev.clientY - startY) < 5) return;
          dragActive = true;
          if (wasTiled) applyUntileAtPointer();
          winDragRef.current = {
            id,
            sx: ev.clientX,
            sy: ev.clientY,
            ot: winGeomRef.current[id].top,
            ol: winGeomRef.current[id].left,
            dw,
            dh,
          };
          document.body.style.cursor = "grabbing";
          document.body.style.userSelect = "none";
          return;
        }
        const d = winDragRef.current;
        if (!d) return;
        const dx = ((ev.clientX - d.sx) / d.dw) * 100;
        const dy = ((ev.clientY - d.sy) / d.dh) * 100;
        setWinGeom((prev) => {
          const hh = prev[d.id].h;
          const ww = prev[d.id].w;
          const top = clampNum(d.ot + dy, 0, 100 - hh);
          const left = clampNum(d.ol + dx, 0, 100 - ww);
          const next = { ...prev, [d.id]: { ...prev[d.id], top, left } };
          winGeomRef.current = next;
          return next;
        });
      };

      const onUp = () => {
        winDragRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [shell],
  );

  const patchP1Popup = useCallback((popId: string, ch: Partial<ParasitePopup>) => {
    setP1Popups((list) => list.map((p) => (p.id === popId ? { ...p, ...ch } : p)));
  }, []);

  const p1SavedRef = useRef<Record<string, WinGeom>>({});

  const toggleP1Max = useCallback((popId: string) => {
    setP1Popups((list) =>
      list.map((p) => {
        if (p.id !== popId) return p;
        if (p.fullscreen) {
          const s = p1SavedRef.current[popId];
          const next = s ? { ...p, ...s, fullscreen: false, maximized: false } : { ...p, fullscreen: false, maximized: false };
          delete p1SavedRef.current[popId];
          return next;
        }
        if (p.maximized) {
          const s = p1SavedRef.current[popId];
          const next = s ? { ...p, ...s, maximized: false } : { ...p, maximized: false };
          return next;
        }
        p1SavedRef.current[popId] = { top: p.top, left: p.left, w: p.w, h: p.h };
        return { ...p, maximized: true };
      }),
    );
  }, []);

  const toggleP1Fullscreen = useCallback((popId: string) => {
    setP1Popups((list) =>
      list.map((p) => {
        if (p.id !== popId) return p;
        if (p.fullscreen) {
          const s = p1SavedRef.current[popId];
          const base = s ?? { top: p.top, left: p.left, w: p.w, h: p.h };
          delete p1SavedRef.current[popId];
          return { ...p, ...base, fullscreen: false, maximized: false };
        }
        if (!p.maximized) p1SavedRef.current[popId] = { top: p.top, left: p.left, w: p.w, h: p.h };
        return { ...p, fullscreen: true, maximized: false };
      }),
    );
  }, []);

  const handleP1ResizeStart = useCallback((popId: string, edge: ResizeEdge, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pop = p1PopupsRef.current.find((x) => x.id === popId);
    if (!pop || pop.minimized || pop.maximized || pop.fullscreen) return;
    const desk = desktopRef.current;
    if (!desk) return;
    const dr = desk.getBoundingClientRect();
    const g: WinGeom = { top: pop.top, left: pop.left, w: pop.w, h: pop.h };
    p1ResizeRef.current = {
      popId,
      edge,
      sx: e.clientX,
      sy: e.clientY,
      g,
      dw: Math.max(1, dr.width),
      dh: Math.max(1, dr.height),
    };
    document.body.style.userSelect = "none";

    const minW = 14;
    const minH = 12;

    const onMove = (ev: MouseEvent) => {
      const d = p1ResizeRef.current;
      if (!d) return;
      const dx = ((ev.clientX - d.sx) / d.dw) * 100;
      const dy = ((ev.clientY - d.sy) / d.dh) * 100;
      const { g: gg, edge: ed } = d;
      let { top, left, w, h } = gg;

      if (ed.includes("e")) w = clampNum(gg.w + dx, minW, 100 - left);
      if (ed.includes("s")) h = clampNum(gg.h + dy, minH, 100 - top);
      if (ed.includes("w")) {
        const nw = clampNum(gg.w - dx, minW, gg.left + gg.w);
        left = gg.left + gg.w - nw;
        w = nw;
      }
      if (ed.includes("n")) {
        const nh = clampNum(gg.h - dy, minH, gg.top + gg.h);
        top = gg.top + gg.h - nh;
        h = nh;
      }

      left = clampNum(left, 0, 100 - w);
      top = clampNum(top, 0, 100 - h);
      if (left + w > 100) w = 100 - left;
      if (top + h > 100) h = 100 - top;

      patchP1Popup(popId, { top, left, w, h });
    };
    const onUp = () => {
      p1ResizeRef.current = null;
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [patchP1Popup]);

  const onRubberPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const desk = desktopRef.current;
    if (!desk) return;
    const r = desk.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    rubberOriginRef.current = { ox: x, oy: y };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setRubberBox({ x, y, w: 0, h: 0 });
  }, []);

  const onRubberPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!rubberOriginRef.current) return;
    const desk = desktopRef.current;
    if (!desk) return;
    const r = desk.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const { ox, oy } = rubberOriginRef.current;
    setRubberBox({
      x: Math.min(ox, cx),
      y: Math.min(oy, cy),
      w: Math.abs(cx - ox),
      h: Math.abs(cy - oy),
    });
  }, []);

  const endRubber = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    rubberOriginRef.current = null;
    setRubberBox(null);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }
  }, []);

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
    if (row.malware === true) {
      setRhKilled(true);
      rhKilledRef.current = true;
    } else setPhase("lost");
  };

  const minerRowsForUi = rhKilled ? TM_PROC_MINER.filter((r) => r.id !== "bad") : TM_PROC_MINER;

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
      <div ref={desktopRef} className="dvs-desktop" aria-label="Симуляция рабочего стола">
        <div className={`dvs-wallpaper dvs-wallpaper--${wallpaperId}`} aria-hidden />

        <div
          className="dvs-desktop-select-surface"
          onPointerDown={onRubberPointerDown}
          onPointerMove={onRubberPointerMove}
          onPointerUp={endRubber}
          onPointerCancel={endRubber}
        />
        {rubberBox && rubberBox.w > 2 && rubberBox.h > 2 ? (
          <div
            className="dvs-rubber-band"
            style={{
              left: rubberBox.x,
              top: rubberBox.y,
              width: rubberBox.w,
              height: rubberBox.h,
            }}
          />
        ) : null}

        {/* Окна (док и меню приложений) */}
        {shell.open.explorer ? (
          <DesktopWindowFrame
            winId="explorer"
            z={winZ("explorer")}
            geom={winGeom.explorer}
            minimized={minimized.explorer}
            maximized={maximized.explorer}
            fullscreen={fullscreen.explorer}
            onClose={() => closeWin("explorer")}
            onMinimize={() => onWinMinimize("explorer")}
            onMaximizeClick={(e) => onWinMaxClick("explorer", e)}
            onPointerDown={() => shell.bringToFront("explorer")}
            onTitleMouseDown={(e) => handleWinTitleMouseDown("explorer", e)}
            onTitleDoubleClick={(e) => onTitleDblClick("explorer", e)}
            onResizeStart={(edge, e) => handleResizeStart("explorer", edge, e)}
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
            z={winZ("antivirus")}
            geom={winGeom.antivirus}
            minimized={minimized.antivirus}
            maximized={maximized.antivirus}
            fullscreen={fullscreen.antivirus}
            onClose={() => closeWin("antivirus")}
            onMinimize={() => onWinMinimize("antivirus")}
            onMaximizeClick={(e) => onWinMaxClick("antivirus", e)}
            onPointerDown={() => shell.bringToFront("antivirus")}
            onTitleMouseDown={(e) => handleWinTitleMouseDown("antivirus", e)}
            onTitleDoubleClick={(e) => onTitleDblClick("antivirus", e)}
            onResizeStart={(edge, e) => handleResizeStart("antivirus", edge, e)}
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
                  onClick={() => {
                    rhAvRef.current = true;
                    setRhAv(true);
                  }}
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
            z={winZ("firewall")}
            geom={winGeom.firewall}
            minimized={minimized.firewall}
            maximized={maximized.firewall}
            fullscreen={fullscreen.firewall}
            onClose={() => closeWin("firewall")}
            onMinimize={() => onWinMinimize("firewall")}
            onMaximizeClick={(e) => onWinMaxClick("firewall", e)}
            onPointerDown={() => shell.bringToFront("firewall")}
            onTitleMouseDown={(e) => handleWinTitleMouseDown("firewall", e)}
            onTitleDoubleClick={(e) => onTitleDblClick("firewall", e)}
            onResizeStart={(edge, e) => handleResizeStart("firewall", edge, e)}
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
            z={winZ("console")}
            geom={winGeom.console}
            minimized={minimized.console}
            maximized={maximized.console}
            fullscreen={fullscreen.console}
            onClose={() => closeWin("console")}
            onMinimize={() => onWinMinimize("console")}
            onMaximizeClick={(e) => onWinMaxClick("console", e)}
            onPointerDown={() => shell.bringToFront("console")}
            onTitleMouseDown={(e) => handleWinTitleMouseDown("console", e)}
            onTitleDoubleClick={(e) => onTitleDblClick("console", e)}
            onResizeStart={(edge, e) => handleResizeStart("console", edge, e)}
            chrome="terminal"
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
            z={winZ("taskmgr")}
            geom={winGeom.taskmgr}
            minimized={minimized.taskmgr}
            maximized={maximized.taskmgr}
            fullscreen={fullscreen.taskmgr}
            onClose={() => closeWin("taskmgr")}
            onMinimize={() => onWinMinimize("taskmgr")}
            onMaximizeClick={(e) => onWinMaxClick("taskmgr", e)}
            onPointerDown={() => shell.bringToFront("taskmgr")}
            onTitleMouseDown={(e) => handleWinTitleMouseDown("taskmgr", e)}
            onTitleDoubleClick={(e) => onTitleDblClick("taskmgr", e)}
            onResizeStart={(edge, e) => handleResizeStart("taskmgr", edge, e)}
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
                  {minerRowsForUi.map((r) => (
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
                    {minerRowsForUi.map((r) => (
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
          ? p1Popups.map((pop) => {
              const tiled = pop.maximized || pop.fullscreen;
              const isRestored = !pop.maximized && !pop.fullscreen;
              const zPop = pop.fullscreen ? Math.max(590, pop.z) : pop.z;
              return (
                <div
                  key={pop.id}
                  className={`dvs-window dvs-window--popup dvs-window--threat dvs-window--ubuntu${tiled ? " dvs-window--tiled" : ""}${pop.maximized ? " dvs-window--maximized" : ""}${pop.fullscreen ? " dvs-window--fullscreen" : ""}${pop.minimized ? " dvs-window--p1-rollup" : ""}`}
                  style={
                    tiled
                      ? { zIndex: zPop }
                      : {
                          top: `${pop.top}%`,
                          left: `${pop.left}%`,
                          width: `${pop.w}%`,
                          height: `${pop.h}%`,
                          zIndex: zPop,
                        }
                  }
                >
                  {!tiled && !pop.minimized ? (
                    <WindowResizeHandles onResizeStart={(edge, e) => handleP1ResizeStart(pop.id, edge, e)} />
                  ) : null}
                  <div
                    className={`dvs-win-titlebar dvs-win-titlebar--gnome dvs-win-titlebar--ubuntu dvs-win-titlebar--popup-gnome${tiled ? " dvs-win-titlebar--tiled" : ""}`}
                    onDoubleClick={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      toggleP1Max(pop.id);
                    }}
                  >
                    <GnomeCaptionButtons
                      onClose={() => closeP1Popup(pop.id)}
                      onMinimize={() => patchP1Popup(pop.id, { minimized: !pop.minimized })}
                      onMaximizeClick={(e) => {
                        if (e.shiftKey) toggleP1Fullscreen(pop.id);
                        else toggleP1Max(pop.id);
                      }}
                      isRestored={isRestored}
                    />
                    <span className="dvs-win-title dvs-win-title--gnome">{pop.title}</span>
                    <span className="dvs-win-titlebar-spacer" aria-hidden />
                  </div>
                  {pop.minimized ? null : (
                    <div className="dvs-win-body dvs-win-body--compact">
                      <p>Подозрительное окно (симуляция).</p>
                    </div>
                  )}
                </div>
              );
            })
          : null}

        {virusId === "process_parasite" && phase === "playing" ? (
          <div className="dvs-hud">
            <span>Всплывающих окон: {p1Popups.length} (лимит 22)</span>
          </div>
        ) : null}

        <header className="dvs-ubuntu-topbar" role="presentation">
          <span className="dvs-ubuntu-activities">Действия</span>
          <time className="dvs-ubuntu-topbar-clock" dateTime={clock.toISOString()}>
            {formatTopBarClock(clock)}
          </time>
          <div className="dvs-ubuntu-topbar-tray" aria-hidden>
            <span className="dvs-tray-icon dvs-tray-icon--wifi" title="" />
            <span className="dvs-tray-icon dvs-tray-icon--vol" title="" />
            <span className="dvs-tray-icon dvs-tray-icon--bat" title="" />
            <span className="dvs-tray-icon dvs-tray-icon--power" title="" />
          </div>
        </header>

        <div className="dvs-ubuntu-panel" ref={startRef}>
          <nav className="dvs-ubuntu-dock" aria-label="Док">
            {(WIN_IDS as readonly WinId[]).map((id) => (
              <button
                key={id}
                type="button"
                className={`dvs-dock-btn${shell.open[id] ? " dvs-dock-btn--running" : ""}`}
                title={WIN_LABELS[id].title}
                onClick={() => activateFromDock(id)}
              >
                <span className="dvs-dock-btn-ico" aria-hidden>
                  <DockIconGlyph winId={id} />
                </span>
              </button>
            ))}
            <div className="dvs-dock-grow" aria-hidden />
            <button
              type="button"
              className={`dvs-dock-btn dvs-dock-btn--apps${startOpen ? " dvs-dock-btn--apps-open" : ""}`}
              aria-expanded={startOpen}
              aria-haspopup="menu"
              aria-label="Показать приложения"
              onClick={() => setStartOpen((o) => !o)}
            >
              <UbuntuShowAppsIcon />
            </button>
          </nav>
          {startOpen ? (
            <div className="dvs-ubuntu-flyout" role="menu">
              <div className="dvs-ubuntu-flyout-title">Приложения</div>
              {(WIN_IDS as readonly WinId[]).map((id) => (
                <button key={id} type="button" className="dvs-ubuntu-flyout-item" role="menuitem" onClick={() => openFromStart(id)}>
                  <span className="dvs-ubuntu-flyout-ico" aria-hidden>
                    <DockIconGlyph winId={id} />
                  </span>
                  {WIN_LABELS[id].menu}
                </button>
              ))}
            </div>
          ) : null}
        </div>
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
