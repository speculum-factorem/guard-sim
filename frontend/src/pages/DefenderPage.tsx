import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type NodeId = "inet" | "fw" | "web01" | "app01" | "db01" | "dc01";
type NodeStatus = "clean" | "scanning" | "compromised" | "isolated" | "defended";
type Phase = "select" | "briefing" | "playing" | "won" | "lost";

interface NodeState {
  status: NodeStatus;
  attacker: boolean;
  cdIsolate: number;
  cdKill: number;
  cdBlock: number;
  cdPatch: number;
}

interface Log {
  id: number;
  ts: string;
  sev: "info" | "warn" | "crit";
  msg: string;
}

interface Scenario {
  id: string;
  name: string;
  difficulty: "easy" | "medium" | "hard";
  diffLabel: string;
  diffColor: string;
  attackType: string;
  description: string;
  briefing: string;
  attackPath: NodeId[];
  tickInterval: number;
  arrivalLogs: Partial<Record<NodeId, string[]>>;
  loseNode: NodeId;
  loseMessage: string;
}

// ═══════════════════════════════════════════════════════════════════════
// NODE LAYOUT (SVG coords)
// ═══════════════════════════════════════════════════════════════════════

interface NodeDef { label: string; sub: string; cx: number; cy: number; circle?: boolean }

const NODE_DEFS: Record<NodeId, NodeDef> = {
  inet:  { label: "ИНТЕРНЕТ", sub: "External",       cx: 255, cy: 52,  circle: true },
  fw:    { label: "FIREWALL", sub: "Checkpoint FW",  cx: 255, cy: 145 },
  web01: { label: "WEB-01",   sub: "nginx / PHP",    cx: 255, cy: 238 },
  app01: { label: "APP-01",   sub: "Spring Boot",    cx: 255, cy: 331 },
  db01:  { label: "DB-01",    sub: "PostgreSQL 15",  cx: 115, cy: 418 },
  dc01:  { label: "DC-01",    sub: "Windows Server", cx: 395, cy: 418 },
};

const EDGES: [NodeId, NodeId][] = [
  ["inet", "fw"], ["fw", "web01"], ["web01", "app01"],
  ["app01", "db01"], ["app01", "dc01"],
];

const ALL_NODE_IDS: NodeId[] = ["inet", "fw", "web01", "app01", "db01", "dc01"];

// ═══════════════════════════════════════════════════════════════════════
// SCENARIOS
// ═══════════════════════════════════════════════════════════════════════

const SCENARIOS: Scenario[] = [
  {
    id: "sqlslayer",
    name: "SQL SLAYER",
    difficulty: "easy",
    diffLabel: "Новичок",
    diffColor: "#3dffa0",
    attackType: "SQL-инъекция",
    description: "Автоматизированный бот нашёл уязвимую форму входа и целенаправленно движется к базе данных клиентов.",
    briefing: "IDS зафиксировал аномальный трафик с 203.45.178.92.\n\nИдёт автоматизированная SQL-инъекция через форму авторизации. Атакующий уже обошёл WAF.\n\nВектор: INTERNET → FW → WEB-01 → APP-01 → DB-01\n\nЦель противника — DB-01 (85 000 записей клиентов).\nКаждые 7 секунд атака продвигается на один шаг.",
    attackPath: ["inet", "fw", "web01", "app01", "db01"],
    tickInterval: 7,
    arrivalLogs: {
      fw:    ["Сканирование портов с 203.45.178.92", "143 неудачных попытки аутентификации за 60 сек"],
      web01: ["SQL payload обнаружен: ' OR '1'='1", "WAF bypass через URL-encoding — фильтр обойдён"],
      app01: ["Несанкционированный вызов API /admin/export_db", "Повышение привилегий: guest → admin"],
      db01:  ["SELECT * FROM customers — запрос не авторизован", "ЭКСФИЛЬТРАЦИЯ НАЧАТА — 85 000 записей"],
    },
    loseNode: "db01",
    loseMessage: "Злоумышленник получил доступ к базе данных. 85 000 записей клиентов скомпрометированы.",
  },
  {
    id: "tigerrat",
    name: "TIGER RAT",
    difficulty: "medium",
    diffLabel: "Средний",
    diffColor: "#ffe600",
    attackType: "APT / боковое перемещение",
    description: "APT-группа использует легитимные инструменты Windows (Living off the Land). Цель — контроллер домена для Golden Ticket.",
    briefing: "Threat Intel: APT-группа TIGER активна в вашей сети.\n\nИспользуют WMI, PowerShell, NTLM relay — стандартные инструменты ОС. Антивирус молчит.\n\nВектор: INTERNET → FW → WEB-01 → APP-01 → DC-01\n\nЕсли они захватят DC-01 — Golden Ticket даст постоянный привилегированный доступ ко ВСЕЙ инфраструктуре.\nКаждые 5 секунд атака продвигается на один шаг.",
    attackPath: ["inet", "fw", "web01", "app01", "dc01"],
    tickInterval: 5,
    arrivalLogs: {
      fw:    ["Cobalt Strike beacon в трафике HTTPS (порт 443)", "Нестандартное использование RDP — подозрительная сессия"],
      web01: ["PHP web-shell загружен: /var/www/.svc.php", "Mimikatz-variant запущен в памяти процесса w3wp.exe"],
      app01: ["WMI lateral movement: app01 → dc01", "Pass-the-Hash через NTLM — хеш получен с web01"],
      dc01:  ["DCSync запрос — репликация учётных данных", "GOLDEN TICKET СОЗДАН — полный контроль домена"],
    },
    loseNode: "dc01",
    loseMessage: "Контроллер домена скомпрометирован. Golden Ticket создан. Атакующий имеет постоянный доступ ко всей инфраструктуре.",
  },
  {
    id: "vaultbreaker",
    name: "VAULT BREAKER",
    difficulty: "hard",
    diffLabel: "Эксперт",
    diffColor: "#ff2d78",
    attackType: "Ransomware LockBit 3.0",
    description: "LockBit 3.0 через EternalBlue. Параллельно шифрует и уничтожает резервные копии. Времени критически мало.",
    briefing: "КРИТИЧЕСКИЙ ИНЦИДЕНТ — НЕМЕДЛЕННЫЙ ОТВЕТ ТРЕБУЕТСЯ.\n\nОбнаружен LockBit 3.0 variant. Эксплуатирует MS17-010 (EternalBlue) по SMB.\nАвтоматически удаляет теневые копии перед шифрованием.\n\nВектор: INTERNET → FW → WEB-01 → APP-01 → DB-01\n\nПосле захвата APP-01 ransomware также атакует DC-01.\nКаждые 4 секунды — новый шаг. Действуй немедленно.",
    attackPath: ["inet", "fw", "web01", "app01", "db01"],
    tickInterval: 4,
    arrivalLogs: {
      fw:    ["EternalBlue exploit MS17-010 — АКТИВНО на порт 445", "Массовое SMB-сканирование всей подсети /24"],
      web01: ["LockBit dropper: /tmp/.config/.cache.bin", "Шифрование /var/www/* началось — 100% за 8 сек"],
      app01: ["Lateral spread: 7 хостов заражены за 2 мин", "vssadmin delete shadows — теневые копии уничтожены"],
      db01:  ["Шифрование базы данных: 100% завершено", "RANSOM.TXT: требование 50 BTC за расшифровку"],
    },
    loseNode: "db01",
    loseMessage: "Ransomware зашифровал базу данных. Резервных копий нет. Инфраструктура парализована. Требование выкупа: 50 BTC.",
  },
];

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

let _lid = 1;
function mkLog(sev: Log["sev"], msg: string): Log {
  const d = new Date();
  return {
    id: _lid++,
    ts: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`,
    sev,
    msg,
  };
}

function nodeColor(st: NodeState): string {
  if (st.attacker) return "#ff3b30";
  switch (st.status) {
    case "compromised": return "#ff3b30";
    case "scanning":    return "#ffe600";
    case "isolated":    return "#6b7c9a";
    case "defended":    return "#00d4ff";
    default:            return "#3dffa0";
  }
}

function initNodes(): Record<NodeId, NodeState> {
  return Object.fromEntries(
    ALL_NODE_IDS.map((id) => [id, {
      status: id === "inet" ? "compromised" as NodeStatus : "clean" as NodeStatus,
      attacker: id === "inet",
      cdIsolate: 0, cdKill: 0, cdBlock: 0, cdPatch: 0,
    }])
  ) as Record<NodeId, NodeState>;
}

const STATUS_LABEL: Record<NodeStatus, string> = {
  clean: "ЧИСТО",
  scanning: "СКАН",
  compromised: "ВЗЛОМАН",
  isolated: "ИЗОЛИРОВАН",
  defended: "ЗАЩИЩЁН",
};

// ═══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function NetworkSvg({
  nodes, selectedNode, onSelect,
}: {
  nodes: Record<NodeId, NodeState>;
  selectedNode: NodeId | null;
  onSelect: (id: NodeId) => void;
}) {
  return (
    <svg viewBox="0 0 510 470" className="defender-svg" aria-label="Карта сети">
      <defs>
        <pattern id="def-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(0,212,255,0.05)" strokeWidth="0.5" />
        </pattern>
        <filter id="def-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="def-glow-red" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="def-glow-sel" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="510" height="470" fill="rgba(5,6,14,0.98)" />
      <rect width="510" height="470" fill="url(#def-grid)" />

      {/* Edges */}
      {EDGES.map(([a, b]) => {
        const da = NODE_DEFS[a], db = NODE_DEFS[b];
        const sa = nodes[a], sb = nodes[b];
        const hostile = sa.attacker || sb.attacker || sa.status === "compromised" || sb.status === "compromised";
        const severed = sa.status === "isolated" || sb.status === "isolated";
        return (
          <g key={`${a}-${b}`}>
            <line x1={da.cx} y1={da.cy} x2={db.cx} y2={db.cy}
              stroke={hostile ? "rgba(255,59,48,0.3)" : "rgba(0,212,255,0.18)"}
              strokeWidth="1.5"
              strokeDasharray={severed ? "6,6" : undefined}
            />
            {!severed && (
              <line x1={da.cx} y1={da.cy} x2={db.cx} y2={db.cy}
                stroke={hostile ? "rgba(255,59,48,0.65)" : "rgba(0,212,255,0.45)"}
                strokeWidth="1.5"
                strokeDasharray="10,15"
                className={`def-edge-flow${hostile ? " def-edge-flow--red" : ""}`}
              />
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {ALL_NODE_IDS.map((id) => {
        const def = NODE_DEFS[id];
        const st = nodes[id];
        const sel = selectedNode === id;
        const col = nodeColor(st);
        const isCirc = !!def.circle;
        const hostile = st.attacker;
        const RW = 42, RH = 22; // half-widths

        return (
          <g key={id} onClick={() => onSelect(id)} className="def-node-g" role="button" tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(id)}
            aria-label={`Узел ${def.label}, статус: ${STATUS_LABEL[st.status]}`}
          >
            {/* Selection glow */}
            {sel && (isCirc
              ? <circle cx={def.cx} cy={def.cy} r={34} fill="none" stroke={col} strokeWidth="1.5" opacity="0.5" filter="url(#def-glow-sel)" className="def-sel-ring" />
              : <rect x={def.cx - RW - 4} y={def.cy - RH - 4} width={(RW + 4) * 2} height={(RH + 4) * 2} rx="6" fill="none" stroke={col} strokeWidth="1.5" opacity="0.5" filter="url(#def-glow-sel)" className="def-sel-ring" />
            )}

            {/* Pulse for attacker */}
            {hostile && (isCirc
              ? <circle cx={def.cx} cy={def.cy} r={30} fill="none" stroke="#ff3b30" strokeWidth="1" className="def-pulse" />
              : <rect x={def.cx - RW - 2} y={def.cy - RH - 2} width={(RW + 2) * 2} height={(RH + 2) * 2} rx="5" fill="none" stroke="#ff3b30" strokeWidth="1.5" className="def-pulse" />
            )}

            {/* Body */}
            {isCirc
              ? <circle cx={def.cx} cy={def.cy} r={26} fill="rgba(5,6,14,0.95)" stroke={col} strokeWidth={sel ? 2 : 1.5} filter={hostile ? "url(#def-glow-red)" : "url(#def-glow)"} />
              : <rect x={def.cx - RW} y={def.cy - RH} width={RW * 2} height={RH * 2} rx="4" fill="rgba(5,6,14,0.95)" stroke={col} strokeWidth={sel ? 2 : 1.5} filter={hostile ? "url(#def-glow-red)" : "url(#def-glow)"} />
            }

            {/* Label */}
            <text x={def.cx} y={def.cy - 4} textAnchor="middle" fill={col} fontSize="9.5" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="0.5">
              {def.label}
            </text>
            <text x={def.cx} y={def.cy + 8} textAnchor="middle" fill="rgba(180,200,220,0.45)" fontSize="7" fontFamily="var(--font-mono)">
              {def.sub}
            </text>

            {/* Status badge (below node) */}
            {st.status !== "clean" && (
              <text x={def.cx} y={def.cy + (isCirc ? 36 : 30)} textAnchor="middle" fill={col} fontSize="7.5" fontFamily="var(--font-mono)" opacity="0.9">
                [{STATUS_LABEL[st.status]}]
              </text>
            )}

            {/* Attacker skull icon */}
            {hostile && (
              <text x={def.cx + (isCirc ? 24 : RW + 2)} y={def.cy - (isCirc ? 18 : RH + 2)} fill="#ff3b30" fontSize="13" className="def-skull">
                ☠
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function LogPanel({ logs }: { logs: Log[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs.length]);

  return (
    <div className="def-log-panel">
      <div className="def-log-header">
        <span>SIEM EVENT LOG</span>
        <span className="def-log-count">{logs.length} events</span>
      </div>
      <div className="def-log-entries" ref={ref}>
        {logs.map((l) => (
          <div key={l.id} className={`def-log-row def-log-row--${l.sev}`}>
            <span className="def-log-ts">{l.ts}</span>
            <span className={`def-log-sev def-log-sev--${l.sev}`}>
              {l.sev === "crit" ? "CRIT" : l.sev === "warn" ? "WARN" : "INFO"}
            </span>
            <span className="def-log-msg">{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export function DefenderPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [nodes, setNodes] = useState<Record<NodeId, NodeState>>(initNodes);
  const [attackerIdx, setAttackerIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [ipBlocked, setIpBlocked] = useState(false);
  const [blockCd, setBlockCd] = useState(0);
  const [scoreFloats, setScoreFloats] = useState<{ id: number; text: string; ok: boolean }[]>([]);
  const [threatLevel, setThreatLevel] = useState(0);
  const [alertFlash, setAlertFlash] = useState(false);

  const addLog = useCallback((sev: Log["sev"], msg: string) => {
    setLogs((prev) => [...prev.slice(-199), mkLog(sev, msg)]);
  }, []);

  const addFloat = useCallback((text: string, ok: boolean) => {
    const id = Date.now();
    setScoreFloats((f) => [...f, { id, text, ok }]);
    setTimeout(() => setScoreFloats((f) => f.filter((x) => x.id !== id)), 1400);
  }, []);

  const flashAlert = useCallback(() => {
    setAlertFlash(true);
    setTimeout(() => setAlertFlash(false), 600);
  }, []);

  // ── Game loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || !scenario) return;

    const tick = setInterval(() => {
      setElapsed((e) => e + 1);
      setBlockCd((c) => Math.max(0, c - 1));

      // Cooldowns on nodes
      setNodes((prev) => {
        const next = { ...prev };
        for (const id of ALL_NODE_IDS) {
          const n = prev[id];
          next[id] = {
            ...n,
            cdIsolate: Math.max(0, n.cdIsolate - 1),
            cdKill:    Math.max(0, n.cdKill - 1),
            cdBlock:   Math.max(0, n.cdBlock - 1),
            cdPatch:   Math.max(0, n.cdPatch - 1),
          };
        }
        return next;
      });

      setCountdown((c) => {
        const next = c - 1;
        if (next > 0) return next;

        // Attacker advances!
        setAttackerIdx((prevIdx) => {
          setNodes((prevNodes) => {
            const sc = scenario;
            const nextIdx = prevIdx + 1;

            if (nextIdx >= sc.attackPath.length) return prevNodes;

            const curNodeId = sc.attackPath[prevIdx];
            const nextNodeId = sc.attackPath[nextIdx];
            const nextNode = prevNodes[nextNodeId];

            // Blocked by isolation
            if (nextNode.status === "isolated" || nextNode.status === "defended") {
              addLog("info", `Атака заблокирована на ${NODE_DEFS[nextNodeId].label} — узел изолирован`);
              addFloat("+80", true);
              setScore((s) => s + 80);
              return prevNodes;
            }

            const updated = { ...prevNodes };

            // Leave current node
            if (curNodeId && updated[curNodeId]) {
              updated[curNodeId] = {
                ...updated[curNodeId],
                attacker: false,
                status: updated[curNodeId].status === "scanning" ? "compromised" : updated[curNodeId].status,
              };
            }

            // Arrive at next node
            if (updated[nextNodeId]) {
              updated[nextNodeId] = {
                ...updated[nextNodeId],
                attacker: true,
                status: "scanning",
              };
            }

            // Add arrival logs
            const arrLogs = sc.arrivalLogs[nextNodeId] ?? [];
            for (const msg of arrLogs) {
              addLog(arrLogs.indexOf(msg) === 0 ? "warn" : "crit", msg);
            }

            setThreatLevel((t) => Math.min(100, t + 20));
            flashAlert();
            addFloat("-30", false);
            setScore((s) => Math.max(0, s - 30));

            // Check loss
            if (nextNodeId === sc.loseNode && updated[nextNodeId].status === "scanning") {
              // Give a 1-tick grace, finalize on next tick or check directly
              setTimeout(() => {
                setNodes((n2) => {
                  if (n2[nextNodeId]?.attacker) {
                    setPhase("lost");
                  }
                  return n2;
                });
              }, (sc.tickInterval * 1000) - 100);
            }

            return updated;
          });

          return prevIdx + 1;
        });

        return scenario.tickInterval + (ipBlocked ? 2 : 0);
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [phase, scenario, ipBlocked, addLog, addFloat, flashAlert]);

  // ── Win condition check ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || !scenario) return;
    const loseNodeSt = nodes[scenario.loseNode];
    if (loseNodeSt?.attacker && loseNodeSt.status !== "isolated" && loseNodeSt.status !== "defended") {
      setPhase("lost");
    }
  }, [nodes, phase, scenario]);

  // ── Start game ──────────────────────────────────────────────────────
  const startGame = useCallback((sc: Scenario) => {
    setScenario(sc);
    setNodes(initNodes());
    setAttackerIdx(0);
    setCountdown(sc.tickInterval);
    setSelectedNode(null);
    setLogs([
      mkLog("info", `Инцидент ${sc.name} — ответные меры активированы`),
      mkLog("warn", "SIEM: аномальная активность зафиксирована"),
      mkLog("crit", `Атака типа «${sc.attackType}» — подтверждено`),
    ]);
    setScore(500);
    setElapsed(0);
    setIpBlocked(false);
    setBlockCd(0);
    setThreatLevel(15);
    setScoreFloats([]);
    setAlertFlash(false);
    setPhase("playing");
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────
  const actIsolate = useCallback((nodeId: NodeId) => {
    setNodes((prev) => {
      const n = prev[nodeId];
      if (n.cdIsolate > 0 || n.status === "isolated") return prev;
      addLog("info", `Изоляция ${NODE_DEFS[nodeId].label}: узел отключён от сети`);
      addFloat("+120", true);
      setScore((s) => s + 120);
      setThreatLevel((t) => Math.max(0, t - 15));
      return {
        ...prev,
        [nodeId]: { ...n, status: "isolated", attacker: false, cdIsolate: 20 },
      };
    });
  }, [addLog, addFloat]);

  const actKillProc = useCallback((nodeId: NodeId) => {
    setNodes((prev) => {
      const n = prev[nodeId];
      if (n.cdKill > 0 || !n.attacker) return prev;
      addLog("warn", `Завершение процессов на ${NODE_DEFS[nodeId].label} — атакующий выбит`);
      addFloat("+60", true);
      setScore((s) => s + 60);
      // Push attacker back one step
      if (scenario) {
        setAttackerIdx((ai) => {
          const prevNodeId = scenario.attackPath[ai - 1];
          if (prevNodeId) {
            setNodes((p2) => ({
              ...p2,
              [nodeId]: { ...p2[nodeId], attacker: false, status: "compromised", cdKill: 14 },
              [prevNodeId]: { ...p2[prevNodeId], attacker: true },
            }));
          }
          return Math.max(0, ai - 1);
        });
      }
      return prev;
    });
  }, [addLog, addFloat, scenario]);

  const actBlockIp = useCallback(() => {
    if (blockCd > 0 || ipBlocked) return;
    setIpBlocked(true);
    setBlockCd(18);
    addLog("info", "Firewall rule добавлено — IP 203.45.178.92 заблокирован. +2 сек/шаг");
    addFloat("+40", true);
    setScore((s) => s + 40);
    setThreatLevel((t) => Math.max(0, t - 10));
  }, [blockCd, ipBlocked, addLog, addFloat]);

  const actPatch = useCallback((nodeId: NodeId) => {
    setNodes((prev) => {
      const n = prev[nodeId];
      if (n.cdPatch > 0 || n.attacker || n.status === "clean" || n.status === "defended") return prev;
      addLog("info", `Патч применён на ${NODE_DEFS[nodeId].label} — уязвимость устранена`);
      addFloat("+100", true);
      setScore((s) => s + 100);
      return {
        ...prev,
        [nodeId]: { ...n, status: "defended", cdPatch: 25 },
      };
    });
  }, [addLog, addFloat]);

  const actCheckLogs = useCallback((nodeId: NodeId) => {
    if (!scenario) return;
    const logs_ = scenario.arrivalLogs[nodeId] ?? [];
    if (logs_.length === 0) {
      addLog("info", `${NODE_DEFS[nodeId].label}: подозрительной активности не обнаружено`);
    } else {
      addLog("warn", `Анализ ${NODE_DEFS[nodeId].label} — обнаружены индикаторы компрометации:`);
      for (const l of logs_) addLog("crit", `  › ${l}`);
    }
    addFloat("+10", true);
    setScore((s) => s + 10);
  }, [scenario, addLog, addFloat]);

  const triggerWin = useCallback(() => {
    addLog("info", "ВСЕ АТАКУЮЩИЕ ВЫБИТЫ — Инцидент локализован");
    setScore((s) => s + elapsed > 0 ? s + Math.floor(300 / Math.max(elapsed, 1) * 60) : s);
    setPhase("won");
  }, [addLog, elapsed]);

  // Manual win check (all critical nodes protected)
  useEffect(() => {
    if (phase !== "playing" || !scenario) return;
    const loseN = nodes[scenario.loseNode];
    const allPathCompromised = scenario.attackPath.every((id) => {
      const n = nodes[id];
      return n.status === "isolated" || n.status === "defended" || id === "inet";
    });
    if (allPathCompromised && !loseN.attacker) {
      triggerWin();
    }
  }, [nodes, phase, scenario, triggerWin]);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER — SELECT
  // ═══════════════════════════════════════════════════════════════════

  if (phase === "select") {
    return (
      <div className="defender-page defender-select-screen">
        <div className="defender-select-inner">
          <div className="defender-select-header">
            <div className="defender-select-badge">SOC DEFENDER</div>
            <h1 className="defender-select-title">INCIDENT RESPONSE</h1>
            <p className="defender-select-sub">
              Ты — аналитик Центра мониторинга безопасности. Атака идёт прямо сейчас.
              Выбери сценарий и останови угрозу до того, как она достигнет критического узла.
            </p>
          </div>

          <div className="defender-scenario-grid">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                className="defender-scenario-card"
                onClick={() => { setScenario(sc); setPhase("briefing"); }}
              >
                <div className="defender-scenario-card-top">
                  <span className="defender-scenario-diff" style={{ color: sc.diffColor, borderColor: sc.diffColor }}>
                    {sc.diffLabel}
                  </span>
                  <span className="defender-scenario-attack-type">{sc.attackType}</span>
                </div>
                <h2 className="defender-scenario-name" style={{ color: sc.diffColor }}>{sc.name}</h2>
                <p className="defender-scenario-desc">{sc.description}</p>
                <div className="defender-scenario-card-footer">
                  <span className="defender-scenario-interval">⏱ каждые {sc.tickInterval}с</span>
                  <span className="defender-scenario-start-hint">ВЫБРАТЬ →</span>
                </div>
              </button>
            ))}
          </div>

          <div className="defender-select-back">
            <Link to="/dashboard" className="btn btn-text">← Вернуться на дашборд</Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER — BRIEFING
  // ═══════════════════════════════════════════════════════════════════

  if (phase === "briefing" && scenario) {
    return (
      <div className="defender-page defender-briefing-screen">
        <div className="defender-briefing-inner">
          <div className="defender-briefing-terminal">
            <div className="defender-briefing-terminal-bar">
              <span className="def-dot def-dot--r" />
              <span className="def-dot def-dot--y" />
              <span className="def-dot def-dot--g" />
              <span className="defender-briefing-terminal-title">SOC TERMINAL — BRIEFING</span>
            </div>
            <div className="defender-briefing-body">
              <p className="defender-briefing-prompt">root@soc-01:~$ cat mission_{scenario.id}.txt</p>
              <div className="defender-briefing-mission-name" style={{ color: scenario.diffColor }}>
                ══ {scenario.name} ══
              </div>
              <pre className="defender-briefing-text">{scenario.briefing}</pre>
              <p className="defender-briefing-prompt defender-briefing-prompt--blink">
                root@soc-01:~$ █
              </p>
            </div>
          </div>

          <div className="defender-briefing-legend">
            <h3 className="defender-briefing-legend-title">Доступные действия:</h3>
            <div className="defender-briefing-actions-list">
              {[
                { key: "ИЗОЛИРОВАТЬ", desc: "Отключить узел от сети — атакующий заблокирован", cd: "20с" },
                { key: "KILL PROCESS", desc: "Завершить вредоносный процесс — атакующий отброшен назад", cd: "14с" },
                { key: "BLOCK IP", desc: "Добавить firewall rule — +2с к каждому ходу атакующего", cd: "18с" },
                { key: "ПРИМЕНИТЬ ПАТЧ", desc: "Устранить уязвимость — узел становится защищённым", cd: "25с" },
                { key: "АНАЛИЗ ЛОГОВ", desc: "Просмотреть индикаторы на узле — +10 очков", cd: "—" },
              ].map((a) => (
                <div key={a.key} className="defender-briefing-action-row">
                  <span className="defender-briefing-action-key">{a.key}</span>
                  <span className="defender-briefing-action-desc">{a.desc}</span>
                  <span className="defender-briefing-action-cd">КД: {a.cd}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="defender-briefing-footer">
            <button type="button" className="btn btn-primary defender-briefing-start-btn"
              onClick={() => startGame(scenario)}>
              ⚡ НАЧАТЬ ОТВЕТНЫЕ МЕРЫ
            </button>
            <button type="button" className="btn btn-text" onClick={() => setPhase("select")}>
              ← Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER — RESULT (won / lost)
  // ═══════════════════════════════════════════════════════════════════

  if ((phase === "won" || phase === "lost") && scenario) {
    const won = phase === "won";
    const compromisedCount = ALL_NODE_IDS.filter((id) => nodes[id].status === "compromised").length;
    const savedCount = ALL_NODE_IDS.filter((id) => nodes[id].status === "isolated" || nodes[id].status === "defended" || nodes[id].status === "clean").length;

    return (
      <div className={`defender-page defender-result-screen defender-result-screen--${won ? "win" : "loss"}`}>
        <div className="defender-result-inner">
          <div className="defender-result-icon">{won ? "🛡" : "💀"}</div>
          <h1 className="defender-result-title">{won ? "УГРОЗА НЕЙТРАЛИЗОВАНА" : "ИНЦИДЕНТ НЕ ЛОКАЛИЗОВАН"}</h1>
          <p className="defender-result-subtitle">
            {won
              ? "Отличная работа. Все критические узлы защищены."
              : scenario.loseMessage}
          </p>

          <div className="defender-result-stats">
            <div className="defender-result-stat">
              <span className="defender-result-stat-value">{score}</span>
              <span className="defender-result-stat-label">ОЧКОВ</span>
            </div>
            <div className="defender-result-stat">
              <span className="defender-result-stat-value">{elapsed}с</span>
              <span className="defender-result-stat-label">ВРЕМЕНИ</span>
            </div>
            <div className="defender-result-stat">
              <span className="defender-result-stat-value" style={{ color: "#3dffa0" }}>{savedCount}</span>
              <span className="defender-result-stat-label">ЗАЩИЩЕНО</span>
            </div>
            <div className="defender-result-stat">
              <span className="defender-result-stat-value" style={{ color: compromisedCount > 0 ? "#ff3b30" : "#3dffa0" }}>{compromisedCount}</span>
              <span className="defender-result-stat-label">ВЗЛОМАНО</span>
            </div>
          </div>

          <div className="defender-result-actions">
            <button type="button" className="btn btn-primary"
              onClick={() => startGame(scenario)}>
              ↺ Ещё раз
            </button>
            <button type="button" className="btn btn-text"
              onClick={() => setPhase("select")}>
              Выбрать сценарий
            </button>
            <Link to="/dashboard" className="btn btn-text">На дашборд</Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER — PLAYING
  // ═══════════════════════════════════════════════════════════════════

  if (phase !== "playing" || !scenario) return null;

  const selNode = selectedNode ? nodes[selectedNode] : null;
  const selDef = selectedNode ? NODE_DEFS[selectedNode] : null;
  const attackerNode = scenario.attackPath[attackerIdx] ?? "inet";

  return (
    <div className={`defender-page defender-game${alertFlash ? " defender-game--flash" : ""}`}>
      {/* Score floats */}
      <div className="def-floats" aria-hidden>
        {scoreFloats.map((f) => (
          <span key={f.id} className={`def-float${f.ok ? " def-float--ok" : " def-float--bad"}`}>{f.text}</span>
        ))}
      </div>

      {/* ── HUD ── */}
      <div className="defender-hud">
        <div className="defender-hud-left">
          <span className="defender-hud-scenario" style={{ color: scenario.diffColor }}>
            {scenario.name}
          </span>
          <span className="defender-hud-type">{scenario.attackType}</span>
        </div>

        <div className="defender-hud-center">
          <div className="defender-threat-wrap">
            <span className="defender-threat-label">УРОВЕНЬ УГРОЗЫ</span>
            <div className="defender-threat-bar">
              <div
                className="defender-threat-fill"
                style={{ width: `${threatLevel}%`, background: threatLevel > 70 ? "#ff3b30" : threatLevel > 40 ? "#ffe600" : "#3dffa0" }}
              />
            </div>
            <span className="defender-threat-pct">{threatLevel}%</span>
          </div>
        </div>

        <div className="defender-hud-right">
          <div className="defender-hud-score">
            <span className="defender-hud-score-label">SCORE</span>
            <span className="defender-hud-score-val">{score}</span>
          </div>
          <div className="defender-hud-timer">
            <span className="defender-hud-timer-label">ВРЕМЯ</span>
            <span className="defender-hud-timer-val">{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</span>
          </div>
          <div className="defender-hud-countdown">
            <span className="defender-hud-countdown-label">СЛЕД. ХОД</span>
            <span className="defender-hud-countdown-val" style={{ color: countdown <= 2 ? "#ff3b30" : "#ffe600" }}>
              {countdown}с
            </span>
          </div>
        </div>
      </div>

      {/* Attacker status banner */}
      <div className="defender-attacker-banner">
        <span className="defender-attacker-icon" aria-hidden>☠</span>
        <span>
          Атакующий на: <strong>{NODE_DEFS[attackerNode]?.label ?? "—"}</strong>
        </span>
        <span className="defender-attacker-sep" aria-hidden>·</span>
        <span>
          Цель: <strong style={{ color: "#ff3b30" }}>{NODE_DEFS[scenario.loseNode].label}</strong>
        </span>
        {ipBlocked && (
          <>
            <span className="defender-attacker-sep" aria-hidden>·</span>
            <span style={{ color: "#3dffa0" }}>IP заблокирован (+2с/ход)</span>
          </>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="defender-main">
        {/* Network map */}
        <div className="defender-map-wrap">
          <NetworkSvg nodes={nodes} selectedNode={selectedNode} onSelect={setSelectedNode} />
        </div>

        {/* Log panel */}
        <LogPanel logs={logs} />
      </div>

      {/* ── Action panel ── */}
      <div className="defender-action-panel">
        {selectedNode && selNode && selDef ? (
          <>
            <div className="def-action-node-info">
              <span className="def-action-node-name">{selDef.label}</span>
              <span className="def-action-node-sub">{selDef.sub}</span>
              <span
                className="def-action-node-status"
                style={{ color: nodeColor(selNode) }}
              >
                [{STATUS_LABEL[selNode.status]}]
              </span>
              {selNode.attacker && (
                <span className="def-action-node-attacker">☠ АТАКУЮЩИЙ ЗДЕСЬ</span>
              )}
            </div>

            <div className="def-action-buttons">
              <button
                type="button"
                className="def-action-btn"
                disabled={selNode.cdIsolate > 0 || selNode.status === "isolated" || selectedNode === "inet"}
                onClick={() => actIsolate(selectedNode)}
                title="Отключить узел от сети"
              >
                <span className="def-action-btn-icon">⊘</span>
                <span className="def-action-btn-label">ИЗОЛИРОВАТЬ</span>
                {selNode.cdIsolate > 0 && <span className="def-action-btn-cd">{selNode.cdIsolate}с</span>}
              </button>

              <button
                type="button"
                className="def-action-btn def-action-btn--orange"
                disabled={selNode.cdKill > 0 || !selNode.attacker}
                onClick={() => actKillProc(selectedNode)}
                title="Завершить вредоносный процесс"
              >
                <span className="def-action-btn-icon">⚡</span>
                <span className="def-action-btn-label">KILL PROCESS</span>
                {selNode.cdKill > 0 && <span className="def-action-btn-cd">{selNode.cdKill}с</span>}
              </button>

              <button
                type="button"
                className="def-action-btn def-action-btn--cyan"
                disabled={blockCd > 0 || ipBlocked}
                onClick={() => actBlockIp()}
                title="Добавить правило блокировки IP"
              >
                <span className="def-action-btn-icon">🛡</span>
                <span className="def-action-btn-label">BLOCK IP</span>
                {blockCd > 0 && <span className="def-action-btn-cd">{blockCd}с</span>}
                {ipBlocked && <span className="def-action-btn-cd">ACTIVE</span>}
              </button>

              <button
                type="button"
                className="def-action-btn def-action-btn--green"
                disabled={
                  selNode.cdPatch > 0 ||
                  selNode.attacker ||
                  selNode.status === "clean" ||
                  selNode.status === "defended" ||
                  selNode.status === "isolated"
                }
                onClick={() => actPatch(selectedNode)}
                title="Применить патч безопасности"
              >
                <span className="def-action-btn-icon">⚙</span>
                <span className="def-action-btn-label">ПРИМЕНИТЬ ПАТЧ</span>
                {selNode.cdPatch > 0 && <span className="def-action-btn-cd">{selNode.cdPatch}с</span>}
              </button>

              <button
                type="button"
                className="def-action-btn def-action-btn--info"
                onClick={() => actCheckLogs(selectedNode)}
                title="Анализ логов узла"
              >
                <span className="def-action-btn-icon">🔍</span>
                <span className="def-action-btn-label">АНАЛИЗ ЛОГОВ</span>
              </button>
            </div>
          </>
        ) : (
          <div className="def-action-hint">
            <span className="def-action-hint-ico" aria-hidden>↑</span>
            Выбери узел на карте для выполнения действий
          </div>
        )}

        <button type="button" className="def-abort-btn btn btn-text"
          onClick={() => setPhase("select")}>
          ✕ Прервать миссию
        </button>
      </div>
    </div>
  );
}
