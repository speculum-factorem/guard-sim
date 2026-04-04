import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DESKTOP_VIRUS_CATALOG,
  type DesktopVirusCatalogEntry,
  type DesktopVirusId,
} from "./desktopVirusCatalog";

type Phase = "playing" | "won" | "lost";

const BAD_POPUP_TITLES = [
  "Срочно: обновите антивирус",
  "Ваш ПК заблокирован (МВД)",
  "Позвоните на горячую линию",
  "Криптокошелёк — подтвердите вход",
  "WIN_PRIZE_2026.exe",
  "Отсканируйте QR для разблокировки",
];

const PHISH_QUEUE: { id: string; legit: boolean; title: string; snippet: string }[] = [
  {
    id: "p1",
    legit: false,
    title: "Банк‑безопасность",
    snippet: "Счёт заблокирован. Перейдите по ссылке за 5 минут.",
  },
  {
    id: "p2",
    legit: true,
    title: "Центр обновлений",
    snippet: "Установлено исправление KB-50412 (подпись Microsoft).",
  },
  {
    id: "p3",
    legit: false,
    title: "DHL: посылка задержана",
    snippet: "Оплатите пошлину через сторонний сервис.",
  },
  {
    id: "p4",
    legit: true,
    title: "Windows Defender",
    snippet: "Завершена быстрая проверка: угроз не найдено.",
  },
  {
    id: "p5",
    legit: false,
    title: "Облако OneDrive",
    snippet: "Ваши файлы удалятся через 24 ч — скачайте архив.",
  },
  {
    id: "p6",
    legit: true,
    title: "SmartScreen",
    snippet: "Заблокирован запуск неизвестного приложения из Интернета.",
  },
];

const WORM_FILES: { id: string; name: string; malware: boolean }[] = [
  { id: "f1", name: "Quarter_Report.xlsx", malware: false },
  { id: "f2", name: "Family_Photos.zip", malware: false },
  { id: "f3", name: "readme.txt", malware: false },
  { id: "f4", name: "invoice.pdf.exe", malware: true },
  { id: "f5", name: "setup.msi", malware: false },
];

const NET_ROWS: { ip: string; label: string; bad: boolean }[] = [
  { ip: "185.234.72.19", label: "tor-exit / сканирование", bad: true },
  { ip: "1.1.1.1", label: "Cloudflare DNS", bad: false },
  { ip: "91.224.90.3", label: "известный C2", bad: true },
  { ip: "104.21.44.88", label: "CDN / доставка контента", bad: false },
];

function formatClock(d: Date): string {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function diffClass(d: DesktopVirusCatalogEntry["difficulty"]): string {
  if (d === "лёгкая") return "easy";
  if (d === "средняя") return "med";
  return "hard";
}

function VirusSelectCard(props: {
  entry: DesktopVirusCatalogEntry;
  onPick: () => void;
}) {
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

  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);

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
        <div className="dvs-wallpaper" />
        {virusId === "process_parasite" ? <GameProcessParasite /> : null}
        {virusId === "file_worm" ? <GameFileWorm /> : null}
        {virusId === "phishing_wave" ? <GamePhishingWave /> : null}
        {virusId === "resource_hog" ? <GameResourceHog /> : null}
        {virusId === "network_bot" ? <GameNetworkBot /> : null}
        <footer className="dvs-taskbar" role="presentation">
          <button type="button" className="dvs-start-btn" aria-label="Пуск" disabled>
            ⧉
          </button>
          <div className="dvs-taskbar-apps" />
          <time className="dvs-taskbar-clock" dateTime={clock.toISOString()}>
            {formatClock(clock)}
          </time>
        </footer>
      </div>
    </div>
  );
}

function GameProcessParasite() {
  const [phase, setPhase] = useState<Phase>("playing");
  const [killed, setKilled] = useState(0);
  const [popups, setPopups] = useState<{ id: string; title: string }[]>([]);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const idRef = useRef(0);

  const closeBad = useCallback((id: string) => {
    setPopups((p) => p.filter((x) => x.id !== id));
    setKilled((k) => k + 1);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    if (killed >= 6) {
      setPhase("won");
      return;
    }
    const tick = window.setInterval(() => {
      setPopups((p) => {
        if (p.length >= 12) {
          window.setTimeout(() => setPhase("lost"), 0);
          return p;
        }
        idRef.current += 1;
        const title = BAD_POPUP_TITLES[Math.floor(Math.random() * BAD_POPUP_TITLES.length)]!;
        return [...p, { id: `b${idRef.current}`, title }];
      });
    }, 4500);
    return () => window.clearInterval(tick);
  }, [phase, killed]);

  useEffect(() => {
    if (phase === "playing" && popups.length >= 12) {
      setPhase("lost");
    }
  }, [phase, popups.length]);

  return (
    <>
      {explorerOpen ? (
        <div className="dvs-window dvs-window--explorer" style={{ top: "12%", left: "8%", width: "min(420px, 88vw)" }}>
          <div className="dvs-win-titlebar">
            <span className="dvs-win-title">Системный проводник</span>
            <button
              type="button"
              className="dvs-win-close"
              aria-label="Закрыть"
              onClick={() => {
                setExplorerOpen(false);
                setPhase("lost");
              }}
            >
              ×
            </button>
          </div>
          <div className="dvs-win-body">
            <p className="dvs-win-hint">Не закрывайте это окно — это часть системы.</p>
            <ul className="dvs-fake-tree">
              <li>📁 Документы</li>
              <li>📁 Загрузки</li>
              <li>📁 Рабочий стол</li>
            </ul>
          </div>
        </div>
      ) : null}

      {popups.map((pop) => (
        <div key={pop.id} className="dvs-window dvs-window--popup dvs-window--threat" style={{ top: `${18 + (pop.id.length % 5) * 8}%`, left: `${20 + (pop.id.charCodeAt(2) % 6) * 10}%`, width: "min(300px, 85vw)" }}>
          <div className="dvs-win-titlebar dvs-win-titlebar--alert">
            <span className="dvs-win-title">{pop.title}</span>
            <button type="button" className="dvs-win-close" aria-label="Закрыть угрозу" onClick={() => closeBad(pop.id)}>
              ×
            </button>
          </div>
          <div className="dvs-win-body dvs-win-body--compact">
            <p>Подозрительное окно. Закройте его крестиком.</p>
          </div>
        </div>
      ))}

      <div className="dvs-hud">
        <span>Устранено: {killed} / 6</span>
        {phase === "won" ? <span className="dvs-hud-ok">Угроза нейтрализована</span> : null}
        {phase === "lost" ? <span className="dvs-hud-bad">Симуляция провалена</span> : null}
      </div>
      {phase !== "playing" ? <ResultOverlay phase={phase} /> : null}
    </>
  );
}

function GameFileWorm() {
  const [phase, setPhase] = useState<Phase>("playing");
  const [selected, setSelected] = useState<string | null>(null);

  const onDelete = () => {
    if (!selected || phase !== "playing") return;
    const f = WORM_FILES.find((x) => x.id === selected);
    if (!f) return;
    if (f.malware) setPhase("won");
    else setPhase("lost");
  };

  return (
    <>
      <div className="dvs-window dvs-window--explorer" style={{ top: "10%", left: "6%", width: "min(480px, 92vw)" }}>
        <div className="dvs-win-titlebar">
          <span className="dvs-win-title">Загрузки</span>
        </div>
        <div className="dvs-win-body">
          <p className="dvs-win-hint">Выделите подозрительный файл и удалите только его.</p>
          <ul className="dvs-file-list">
            {WORM_FILES.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  className={`dvs-file-row${selected === f.id ? " dvs-file-row--selected" : ""}`}
                  onClick={() => setSelected(f.id)}
                >
                  <span className="dvs-file-ico" aria-hidden>
                    📄
                  </span>
                  {f.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="dvs-toolbar">
            <button type="button" className="dvs-btn dvs-btn--danger" disabled={!selected} onClick={onDelete}>
              Удалить
            </button>
          </div>
        </div>
      </div>
      {phase !== "playing" ? <ResultOverlay phase={phase} /> : null}
    </>
  );
}

function GamePhishingWave() {
  const [phase, setPhase] = useState<Phase>("playing");
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const cur = PHISH_QUEUE[idx];

  const answer = useCallback(
    (trust: boolean) => {
      if (phase !== "playing" || !cur) return;
      const wrong = cur.legit ? !trust : trust;
      const nextM = mistakes + (wrong ? 1 : 0);
      if (nextM >= 3) {
        setMistakes(nextM);
        setPhase("lost");
        return;
      }
      setMistakes(nextM);
      if (idx + 1 >= PHISH_QUEUE.length) {
        setPhase("won");
      } else {
        setIdx((i) => i + 1);
      }
    },
    [cur, idx, mistakes, phase],
  );

  if (!cur) {
    return phase === "won" ? <ResultOverlay phase="won" /> : null;
  }

  return (
    <>
      <div className="dvs-window dvs-window--toast-center" style={{ top: "14%", left: "50%", transform: "translateX(-50%)", width: "min(400px, 92vw)" }}>
        <div className="dvs-win-titlebar">
          <span className="dvs-win-title">Центр уведомлений</span>
        </div>
        <div className="dvs-win-body">
          <div className="dvs-notif-card">
            <strong>{cur.title}</strong>
            <p>{cur.snippet}</p>
          </div>
          <div className="dvs-notif-actions">
            <button type="button" className="dvs-btn dvs-btn--ghost" onClick={() => answer(false)}>
              Пропустить
            </button>
            <button type="button" className="dvs-btn dvs-btn--primary" onClick={() => answer(true)}>
              Доверять
            </button>
          </div>
          <p className="dvs-win-hint dvs-win-hint--small">
            Сообщение {idx + 1} из {PHISH_QUEUE.length} · ошибок: {mistakes}/3
          </p>
        </div>
      </div>
      {phase !== "playing" ? <ResultOverlay phase={phase} /> : null}
    </>
  );
}

const PROC_ROWS: { id: string; name: string; cpu: number; malware: boolean }[] = [
  { id: "sys", name: "System", cpu: 0.4, malware: false },
  { id: "exp", name: "explorer.exe", cpu: 2.1, malware: false },
  { id: "msedge", name: "msedge.exe", cpu: 8.4, malware: false },
  { id: "bad", name: "mshelper (копия)", cpu: 89.0, malware: true },
];

function GameResourceHog() {
  const [phase, setPhase] = useState<Phase>("playing");

  const endTask = (id: string) => {
    if (phase !== "playing") return;
    const row = PROC_ROWS.find((r) => r.id === id);
    if (!row) return;
    if (row.malware) setPhase("won");
    else setPhase("lost");
  };

  return (
    <>
      <div className="dvs-window dvs-window--tm" style={{ top: "8%", left: "10%", width: "min(520px, 94vw)" }}>
        <div className="dvs-win-titlebar">
          <span className="dvs-win-title">Диспетчер задач</span>
        </div>
        <div className="dvs-win-body">
          <p className="dvs-win-hint">Сортировка по CPU. Завершите подозрительный процесс.</p>
          <table className="dvs-tm-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>CPU %</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {PROC_ROWS.map((r) => (
                <tr key={r.id} className={r.cpu > 50 ? "dvs-tm-hot" : ""}>
                  <td>{r.name}</td>
                  <td>{r.cpu.toFixed(1)}</td>
                  <td>
                    <button type="button" className="dvs-btn dvs-btn--small" onClick={() => endTask(r.id)}>
                      Снять задачу
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {phase !== "playing" ? <ResultOverlay phase={phase} /> : null}
    </>
  );
}

function GameNetworkBot() {
  const [phase, setPhase] = useState<Phase>("playing");
  const [blocked, setBlocked] = useState<Set<string>>(() => new Set());
  const [left, setLeft] = useState(75);

  const badIps = useMemo(() => NET_ROWS.filter((r) => r.bad).map((r) => r.ip), []);
  const allBadBlocked = badIps.every((ip) => blocked.has(ip));
  const goodBlocked = NET_ROWS.some((r) => !r.bad && blocked.has(r.ip));

  useEffect(() => {
    if (phase !== "playing") return;
    const t = window.setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (goodBlocked) setPhase("lost");
  }, [phase, goodBlocked]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (allBadBlocked && !goodBlocked) setPhase("won");
  }, [phase, allBadBlocked, goodBlocked]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (left === 0 && !allBadBlocked) setPhase("lost");
  }, [phase, left, allBadBlocked]);

  const toggleBlock = (ip: string) => {
    if (phase !== "playing") return;
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(ip)) next.delete(ip);
      else next.add(ip);
      return next;
    });
  };

  return (
    <>
      <div className="dvs-window dvs-window--fw" style={{ top: "10%", left: "6%", width: "min(500px, 94vw)" }}>
        <div className="dvs-win-titlebar">
          <span className="dvs-win-title">Брандмауэр — исходящие</span>
        </div>
        <div className="dvs-win-body">
          <p className="dvs-win-hint">Заблокируйте вредоносные IP. Не блокируйте доверенный DNS.</p>
          <p className="dvs-fw-timer">
            Осталось: <strong>{left}</strong> с
          </p>
          <ul className="dvs-fw-list">
            {NET_ROWS.map((r) => (
              <li key={r.ip} className="dvs-fw-row">
                <div>
                  <code>{r.ip}</code>
                  <span className="dvs-fw-label">{r.label}</span>
                </div>
                <button
                  type="button"
                  className={`dvs-btn dvs-btn--small${blocked.has(r.ip) ? " dvs-btn--blocked" : ""}`}
                  onClick={() => toggleBlock(r.ip)}
                >
                  {blocked.has(r.ip) ? "Разблокировать" : "Заблокировать"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {phase !== "playing" ? <ResultOverlay phase={phase} /> : null}
    </>
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
