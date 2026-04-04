import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

type LineKind = "shebang" | "comment" | "echo" | "suspicious" | "command" | "blank";

function classifyLine(line: string): LineKind {
  const t = line.trim();
  if (t === "") return "blank";
  if (t.startsWith("#!")) return "shebang";
  if (t.startsWith("#")) return "comment";
  if (/^\s*echo\s/.test(t)) return "echo";
  if (
    /\bcurl\b/.test(t) ||
    /\bwget\b/.test(t) ||
    (/\bbash\b/.test(t) && t.includes("|"))
  )
    return "suspicious";
  return "command";
}

const LINE_HINTS: Record<LineKind, string> = {
  shebang: "Shebang-строка: задаёт интерпретатор (bash). Стандартная практика.",
  comment: "Комментарий — не выполняется. Метаданные или описание.",
  echo: "Вывод текста на экран. Безопасно — только отображение.",
  command: "Системная команда. Относится к обычному администрированию.",
  suspicious:
    "⚠ Сетевой запрос с немедленным выполнением (curl/wget | bash). Загружает и запускает произвольный код с внешнего хоста — потенциально опасно.",
  blank: "",
};

export function TerminalSessionSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, childrenFooter } = props;

  const hostname = step.emailSubject?.trim() || "prod-server-01";
  const shortHost = hostname.split(".")[0] ?? hostname;
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const orphan = useMemo(() => step.hotspots, [step.hotspots]);

  const [scanMode, setScanMode] = useState(false);
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const [miniToast, setMiniToast] = useState<string | null>(null);

  const scriptLines = useMemo(() => step.narrative.split("\n"), [step.narrative]);

  useEffect(() => {
    setScanMode(false);
    setExpandedLine(null);
    setMiniToast(null);
  }, [step.id]);

  useEffect(() => {
    if (!miniToast) return;
    const t = window.setTimeout(() => setMiniToast(null), 2500);
    return () => clearTimeout(t);
  }, [miniToast]);

  function handleScan() {
    const next = !scanMode;
    setScanMode(next);
    if (next) {
      const found = scriptLines.filter((l) => classifyLine(l) === "suspicious").length;
      setMiniToast(
        found > 0
          ? `Сканирование: найдено ${found} сетевых вызовов — отмечены оранжевым`
          : "Явных сетевых команд не найдено",
      );
    } else {
      setMiniToast("Режим сканирования отключён");
    }
  }

  function handleLineClick(i: number, kind: LineKind) {
    if (kind === "blank") return;
    setExpandedLine(expandedLine === i ? null : i);
  }

  return (
    <div className="ui-frame ui-frame-terminal sim-term-root">
      {miniToast ? <div className="sim-mini-toast">{miniToast}</div> : null}

      {/* ── Title bar ── */}
      <header className="sim-term-titlebar" aria-label="Терминал">
        <div className="sim-term-traffic" aria-hidden>
          <span className="sim-term-dot sim-term-dot--red" />
          <span className="sim-term-dot sim-term-dot--yellow" />
          <span className="sim-term-dot sim-term-dot--green" />
        </div>
        <span className="sim-term-window-title">Bash — {hostname}</span>
        <button
          type="button"
          className={`sim-term-scan-btn${scanMode ? " sim-term-scan-btn--on" : ""}`}
          title={scanMode ? "Выключить сканирование" : "Подсветить сетевые команды"}
          onClick={handleScan}
        >
          {scanMode ? "⊘ Стоп" : "⌕ Сканировать"}
        </button>
      </header>

      {/* ── Terminal body ── */}
      <div className="sim-term-body">
        {/* Prompt line */}
        <div className="sim-term-prompt-line">
          <span className="sim-term-ps-user">user</span>
          <span className="sim-term-ps-at">@</span>
          <span className="sim-term-ps-host">{shortHost}</span>
          <span className="sim-term-ps-cwd"> ~</span>
          <span className="sim-term-ps-dollar"> $</span>
          <span className="sim-term-cmd-typed"> cat maintenance.sh</span>
        </div>

        {/* Script */}
        <div className="sim-term-script" role="region" aria-label="Содержимое скрипта maintenance.sh">
          {scriptLines.map((line, i) => {
            const kind = classifyLine(line);
            const isSuspect = kind === "suspicious";
            const isExpanded = expandedLine === i;
            const interactive = kind !== "blank";

            return (
              <div
                key={i}
                className={[
                  "sim-term-line",
                  `sim-term-line--${kind}`,
                  scanMode && isSuspect ? "sim-term-line--flagged" : "",
                  isExpanded ? "sim-term-line--open" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  className="sim-term-line-btn"
                  disabled={!interactive}
                  onClick={() => handleLineClick(i, kind)}
                  title={interactive ? "Нажмите для анализа строки" : undefined}
                  aria-expanded={interactive ? isExpanded : undefined}
                >
                  <span className="sim-term-lno" aria-hidden>
                    {String(i + 1).padStart(3)}
                  </span>
                  <code className="sim-term-ltext">{line || "\u00a0"}</code>
                  {isSuspect ? (
                    <span className="sim-term-warn-badge" aria-label="Подозрительная команда">
                      ⚠
                    </span>
                  ) : null}
                </button>
                {isExpanded ? (
                  <div className="sim-term-line-hint" role="note">
                    {LINE_HINTS[kind]}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Trailing prompt with cursor */}
        <div className="sim-term-prompt-line sim-term-prompt-trail">
          <span className="sim-term-ps-user">user</span>
          <span className="sim-term-ps-at">@</span>
          <span className="sim-term-ps-host">{shortHost}</span>
          <span className="sim-term-ps-cwd"> ~</span>
          <span className="sim-term-ps-dollar"> $</span>
          <span className="sim-term-cursor" aria-hidden>
            ▋
          </span>
        </div>

        {noise}
      </div>

      <OrphanHotspotRow hotspots={orphan} disabled={disabled} onChoose={onChoose} />
      {childrenFooter}
    </div>
  );
}
