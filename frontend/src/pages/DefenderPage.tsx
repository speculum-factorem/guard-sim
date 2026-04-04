import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type NodeId = "inet" | "fw" | "web01" | "app01" | "db01" | "dc01";
type NodeStatus = "clean" | "scanning" | "compromised" | "isolated" | "defended";
type Phase = "select" | "briefing" | "playing" | "won" | "lost";
type GameMode = "training" | "combat";
type PlaybookKey = "logs" | "wireshark" | "nmap" | "strings" | "block" | "kill" | "isolate" | "patch";
type PlaybookFlags = Record<PlaybookKey, boolean>;
type TermLineType = "input" | "output" | "error" | "info" | "system";
interface TermLine { id: number; type: TermLineType; text: string }

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
  /** Базовый интервал хода (сек.) в боевом режиме */
  tickInterval: number;
  arrivalLogs: Partial<Record<NodeId, string[]>>;
  loseNode: NodeId;
  loseMessage: string;
  /** Ключ из STRINGS_FILES — обязателен для закрытия инцидента */
  stringsArtifact: string;
  /** Узел, на котором нужно выполнить patch по протоколу */
  patchPlaybookNode: NodeId;
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

/** Подсеть для симуляции nmap (и алиасы в help). */
const NMAP_SUBNET = "10.10.0.0/24";
const NMAP_SUBNET_ALIASES = new Set(["10.10.0.0/24", "10.10.0/24", "10.10.0.0", "corp", "corp.lan", "internal"]);

function normalizeNmapSubnet(arg: string): string | null {
  const t = arg.toLowerCase().replace(/\s+/g, "");
  if (t === "10.10.0.0/24" || t === "10.10.0/24" || t === "10.10.0.0") return NMAP_SUBNET;
  if (NMAP_SUBNET_ALIASES.has(t)) return NMAP_SUBNET;
  return null;
}

type PushTermFn = (text: string, type?: TermLineType) => void;

function emitWiresharkCapture(scenarioId: string, nodeId: NodeId, pushTerm: PushTermFn) {
  const host = NODE_DEFS[nodeId].label;
  pushTerm(`━━ Wireshark · симулированный захват · ${host} (${nodeId}) ━━`, "info");
  pushTerm("  No.  Time      Source           Destination      Proto  Length  Info", "output");
  pushTerm("  ---  --------  ---------------  ---------------  -----  ------  ----", "output");

  const rows: { line: string; anomaly?: boolean }[] = [];

  if (scenarioId === "sqlslayer") {
    rows.push({ line: "  12   0.0001    203.45.178.92    10.10.0.12       TCP    74      SYN → 443" });
    rows.push({ line: "  18   0.0042    10.10.0.12       203.45.178.92    TCP    66      ACK" });
    if (nodeId === "web01") {
      rows.push({ line: "  44   0.1120    203.45.178.92    10.10.0.12       HTTP   512     POST /login.php — payload: %27+OR+%271%27%3D%271", anomaly: true });
    } else {
      rows.push({ line: "  44   0.1120    10.10.0.12       10.10.0.20       HTTP   428     GET /health 200" });
    }
    rows.push({ line: "  51   0.2401    10.10.0.12       8.8.8.8          DNS    98      A? cdn.example.com" });
  } else if (scenarioId === "tigerrat") {
    rows.push({ line: "  07   0.0008    10.10.0.20       10.10.0.44       TCP    72      49667 → 135 SYN" });
    rows.push({ line: "  15   0.0310    10.10.0.44       10.10.0.20       TCP    64      RST" });
    if (nodeId === "app01" || nodeId === "web01") {
      rows.push({ line: "  88   0.9055    10.10.0.20       185.220.101.47   TLS    1436    Application Data (encrypted) — длительная сессия, heartbeat 60s", anomaly: true });
    } else {
      rows.push({ line: "  88   0.9055    10.10.0.20       52.84.12.1       TLS    512   API sync (legit CDN)" });
    }
    rows.push({ line: "  99   1.2000    10.10.0.44       10.10.0.20       SMB2   240     Session Setup" });
  } else {
    // vaultbreaker
    rows.push({ line: "  03   0.0002    203.45.178.92    10.10.0.12       TCP    74      SYN → 445" });
    rows.push({ line: "  22   0.0088    203.45.178.92    10.10.0.12       SMB    1208    Negotiate Protocol" });
    if (nodeId === "fw" || nodeId === "web01") {
      rows.push({ line: "  31   0.0190    203.45.178.92    10.10.0.12       SMB    2048    Trans2 FIND_FIRST2 — MS17-010 exploit pattern (ETERNALBLUE)", anomaly: true });
    } else {
      rows.push({ line: "  31   0.0190    10.10.0.12       10.10.0.20       SMB    896     Tree Connect \\\\APP-01\\IPC$" });
    }
    rows.push({ line: "  40   0.0401    10.10.0.20       10.10.0.30       TCP    66      22 → 5432 (forwarded)" });
  }

  for (const r of rows) {
    pushTerm(r.line, r.anomaly ? "error" : "output");
  }
  const anomalyHint =
    scenarioId === "sqlslayer" && nodeId === "web01"
      ? "Аномалия: SQL-инъекция в HTTP POST (URL-encoded OR 1=1)."
      : scenarioId === "tigerrat" && (nodeId === "app01" || nodeId === "web01")
        ? "Аномалия: исходящий долгий TLS к 185.220.101.47 — типичный C2 / внешний хост вне allowlist."
        : scenarioId === "vaultbreaker" && (nodeId === "fw" || nodeId === "web01")
          ? "Аномалия: SMB с сигнатурой MS17-010 (EternalBlue) с внешнего IP."
          : "На этом узле явных отклонений в выборке нет — смотри строки, помеченные как подозрительные на других хостах.";
  pushTerm(`★ ${anomalyHint}`, "info");
}

function emitNmapScan(scenarioId: string, pushTerm: PushTermFn) {
  pushTerm(`Starting Nmap 7.94 ( https://nmap.org ) — симуляция сканирования ${NMAP_SUBNET}`, "info");
  pushTerm("Interesting ports on 10.10.0.1 (gateway.corp):", "output");
  pushTerm("  PORT    STATE SERVICE", "output");
  pushTerm("  22/tcp  open  ssh", "output");
  pushTerm("  53/tcp  open  domain", "output");
  pushTerm("", "output");
  pushTerm("Interesting ports on 10.10.0.12 (web-01):", "output");
  pushTerm("  PORT     STATE SERVICE", "output");
  pushTerm("  22/tcp   open  ssh", "output");
  pushTerm("  80/tcp   open  http", "output");
  pushTerm("  443/tcp  open  https", "output");
  pushTerm("", "output");
  pushTerm("Interesting ports on 10.10.0.20 (app-01):", "output");
  pushTerm("  PORT     STATE SERVICE", "output");
  pushTerm("  22/tcp   open  ssh", "output");
  pushTerm("  8080/tcp open  http-proxy", "output");
  pushTerm("", "output");

  if (scenarioId === "sqlslayer") {
    pushTerm("Interesting ports on 10.10.0.88 (legacy-mysql):", "output");
    pushTerm("  PORT      STATE SERVICE", "output");
    pushTerm("  3306/tcp  open  mysql", "output");
    pushTerm("  4444/tcp  open  krb524   ← АНОМАЛИЯ: порт часто используется ботнетами / reverse shell", "error");
  } else if (scenarioId === "tigerrat") {
    pushTerm("Interesting ports on 10.10.0.44 (dc-01):", "output");
    pushTerm("  PORT      STATE SERVICE", "output");
    pushTerm("  88/tcp    open  kerberos-sec", "output");
    pushTerm("  135/tcp   open  msrpc", "output");
    pushTerm("  389/tcp   open  ldap", "output");
    pushTerm("  5985/tcp  open  wsman", "output");
    pushTerm("  47001/tcp open  winrm      ← АНОМАЛИЯ: нестандартный listener WinRM на высоком порту (часто persistence)", "error");
  } else {
    pushTerm("Interesting ports on 10.10.0.30 (db-01):", "output");
    pushTerm("  PORT      STATE SERVICE", "output");
    pushTerm("  22/tcp    open  ssh", "output");
    pushTerm("  5432/tcp  open  postgresql", "output");
    pushTerm("  3389/tcp  open  ms-wbt-server  ← АНОМАЛИЯ: RDP на DB-сервере (нарушение сегментации)", "error");
  }
  pushTerm("", "output");
  pushTerm(`Nmap done: 256 IP addresses (6 hosts up) scanned in 2.31s  [sim]`, "output");
}

const STRINGS_FILES: Record<string, { title: string; lines: string[] }> = {
  "/var/www/.svc.php": {
    title: "/var/www/.svc.php",
    lines: [
      "<?php",
      "@eval($_POST['x']);",
      "base64_decode",
      "HTTP/1.1 200 OK",
    ],
  },
  "/tmp/.config/.cache.bin": {
    title: "/tmp/.config/.cache.bin",
    lines: [
      "LockBit",
      "vssadmin delete shadows",
      "\\\\DC-01\\C$",
      "MS17_010",
    ],
  },
  "dropper.bin": {
    title: "dropper.bin",
    lines: [
      "curl",
      "bash",
      "/dev/tcp/",
    ],
  },
  "/opt/app/shell.jsp": {
    title: "/opt/app/shell.jsp",
    lines: [
      "Runtime.getRuntime().exec",
      "cmd.exe /c",
    ],
  },
};

function resolveStringsPath(raw: string): string | null {
  const t = raw.trim().replace(/\\/g, "/");
  const lower = t.toLowerCase();
  if (STRINGS_FILES[lower]) return lower;
  if (STRINGS_FILES[t]) return t;
  const base = lower.split("/").pop() ?? lower;
  const hit = Object.keys(STRINGS_FILES).find((k) => k.endsWith(base) || k.split("/").pop() === base);
  return hit ?? null;
}

function normStringsKey(k: string): string {
  return k.replace(/\\/g, "/").toLowerCase();
}

function emitStringsDump(resolvedPath: string, pushTerm: PushTermFn) {
  const art = STRINGS_FILES[resolvedPath];
  if (!art) {
    pushTerm("Внутренняя ошибка: артефакт не найден.", "error");
    return;
  }
  pushTerm(`strings (sim) — ${art.title}`, "info");
  pushTerm("--- printable sequences ---", "output");
  for (const ln of art.lines) {
    const suspicious =
      ln.includes("eval") ||
      ln.includes("base64") ||
      ln.includes("LockBit") ||
      ln.includes("vssadmin") ||
      ln.includes("MS17") ||
      ln.includes("Runtime.getRuntime") ||
      ln.includes("/dev/tcp");
    pushTerm(`  ${ln}`, suspicious ? "error" : "output");
  }
  pushTerm("★ Ищи нехарактерные для легитимного ПО строки (eval, вызов shell, шифровальщик, эксплойт).", "info");
}

// ═══════════════════════════════════════════════════════════════════════
// SCENARIOS
// ═══════════════════════════════════════════════════════════════════════

const SCENARIOS: Scenario[] = [
  {
    id: "sqlslayer",
    name: "SQL SLAYER",
    difficulty: "easy",
    diffLabel: "Сюжет 1",
    diffColor: "#3dffa0",
    attackType: "SQL-инъекция",
    description: "Бот давит форму входа и движется к БД. Одинаковый темп во всех сюжетах; победа только после полного протокола SOC.",
    briefing: "IDS: аномальный трафик с 203.45.178.92. SQL-инъекция через login, WAF обойден.\n\nВектор: INTERNET → FW → WEB-01 → APP-01 → DB-01. Цель — DB-01.\n\nПОБЕДА: все узлы на пути закрыты (изоляция или патч) И выполнен полный чеклист: logs, wireshark, nmap, strings (артефакт сценария), block, kill, isolate, patch на узле из брифинга.",
    attackPath: ["inet", "fw", "web01", "app01", "db01"],
    tickInterval: 6,
    arrivalLogs: {
      fw:    ["Сканирование портов с 203.45.178.92", "143 неудачных попытки аутентификации за 60 сек"],
      web01: ["SQL payload обнаружен: ' OR '1'='1", "WAF bypass через URL-encoding — фильтр обойдён"],
      app01: ["Несанкционированный вызов API /admin/export_db", "Повышение привилегий: guest → admin"],
      db01:  ["SELECT * FROM customers — запрос не авторизован", "ЭКСФИЛЬТРАЦИЯ НАЧАТА — 85 000 записей"],
    },
    loseNode: "db01",
    loseMessage: "Злоумышленник получил доступ к базе данных. 85 000 записей клиентов скомпрометированы.",
    stringsArtifact: "/opt/app/shell.jsp",
    patchPlaybookNode: "web01",
  },
  {
    id: "tigerrat",
    name: "TIGER RAT",
    difficulty: "medium",
    diffLabel: "Сюжет 2",
    diffColor: "#ffe600",
    attackType: "APT / LoL",
    description: "APT в сети, движение к DC. Нужны расследование (логи, трафик, nmap, strings) и все действия реагирования.",
    briefing: "APT TIGER: WMI, PowerShell, NTLM relay. Вектор: INTERNET → … → DC-01 (Golden Ticket).\n\nstrings: веб-шелл /var/www/.svc.php. patch только на APP-01 после kill на этом узле.\nПолный чеклист в шапке игры обязателен для закрытия инцидента.",
    attackPath: ["inet", "fw", "web01", "app01", "dc01"],
    tickInterval: 6,
    arrivalLogs: {
      fw:    ["Cobalt Strike beacon в трафике HTTPS (порт 443)", "Нестандартное использование RDP — подозрительная сессия"],
      web01: ["PHP web-shell загружен: /var/www/.svc.php", "Mimikatz-variant запущен в памяти процесса w3wp.exe"],
      app01: ["WMI lateral movement: app01 → dc01", "Pass-the-Hash через NTLM — хеш получен с web01"],
      dc01:  ["DCSync запрос — репликация учётных данных", "GOLDEN TICKET СОЗДАН — полный контроль домена"],
    },
    loseNode: "dc01",
    loseMessage: "Контроллер домена скомпрометирован. Golden Ticket создан. Атакующий имеет постоянный доступ ко всей инфраструктуре.",
    stringsArtifact: "/var/www/.svc.php",
    patchPlaybookNode: "app01",
  },
  {
    id: "vaultbreaker",
    name: "VAULT BREAKER",
    difficulty: "hard",
    diffLabel: "Сюжет 3",
    diffColor: "#ff2d78",
    attackType: "Ransomware",
    description: "LockBit / EternalBlue к БД. Тот же ритм хода; без полного протокола инцидент не считается закрытым.",
    briefing: "LockBit 3.0, MS17-010 по SMB. Вектор к DB-01.\n\nstrings: /tmp/.config/.cache.bin. patch на APP-01.\nЧеклист: logs, wireshark, nmap, strings, block, kill, isolate, patch — всё должно быть выполнено хотя бы раз.",
    attackPath: ["inet", "fw", "web01", "app01", "db01"],
    tickInterval: 6,
    arrivalLogs: {
      fw:    ["EternalBlue exploit MS17-010 — АКТИВНО на порт 445", "Массовое SMB-сканирование всей подсети /24"],
      web01: ["LockBit dropper: /tmp/.config/.cache.bin", "Шифрование /var/www/* началось — 100% за 8 сек"],
      app01: ["Lateral spread: 7 хостов заражены за 2 мин", "vssadmin delete shadows — теневые копии уничтожены"],
      db01:  ["Шифрование базы данных: 100% завершено", "RANSOM.TXT: требование 50 BTC за расшифровку"],
    },
    loseNode: "db01",
    loseMessage: "Ransomware зашифровал базу данных. Резервных копий нет. Инфраструктура парализована. Требование выкупа: 50 BTC.",
    stringsArtifact: "/tmp/.config/.cache.bin",
    patchPlaybookNode: "app01",
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

const PLAYBOOK_ORDER: PlaybookKey[] = ["logs", "wireshark", "nmap", "strings", "block", "kill", "isolate", "patch"];

const PLAYBOOK_SHORT: Record<PlaybookKey, string> = {
  logs: "logs",
  wireshark: "shark",
  nmap: "nmap",
  strings: "str",
  block: "block",
  kill: "kill",
  isolate: "iso",
  patch: "patch",
};

function emptyPlaybook(): PlaybookFlags {
  return {
    logs: false,
    wireshark: false,
    nmap: false,
    strings: false,
    block: false,
    kill: false,
    isolate: false,
    patch: false,
  };
}

function playbookComplete(p: PlaybookFlags): boolean {
  return PLAYBOOK_ORDER.every((k) => p[k]);
}

function firstMissingPlaybook(p: PlaybookFlags): PlaybookKey | null {
  for (const k of PLAYBOOK_ORDER) {
    if (!p[k]) return k;
  }
  return null;
}

function cooldownSec(base: number, mode: GameMode): number {
  return Math.max(2, Math.round(base * (mode === "training" ? 0.45 : 1)));
}

function tickForMode(sc: Scenario, mode: GameMode): number {
  if (mode === "training") return Math.max(12, Math.round(sc.tickInterval * 2.2));
  return Math.max(5, sc.tickInterval);
}

function PlaybookBar({ flags, training }: { flags: PlaybookFlags; training: boolean }) {
  const miss = firstMissingPlaybook(flags);
  return (
    <div className="defender-playbook" aria-label="Чеклист протокола SOC">
      <span className="defender-playbook-label">ЧЕКЛИСТ</span>
      {PLAYBOOK_ORDER.map((k) => (
        <span
          key={k}
          className={`def-playbook-chip${flags[k] ? " def-playbook-chip--done" : ""}${training && miss === k ? " def-playbook-chip--hint" : ""}`}
        >
          {flags[k] ? "✓" : "○"} {PLAYBOOK_SHORT[k]}
        </span>
      ))}
    </div>
  );
}

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
  const [gameMode, setGameMode] = useState<GameMode>("combat");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [nodes, setNodes] = useState<Record<NodeId, NodeState>>(initNodes);
  const [attackerIdx, setAttackerIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [tickSeconds, setTickSeconds] = useState(6);
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [ipBlocked, setIpBlocked] = useState(false);
  const [blockCd, setBlockCd] = useState(0);
  const [scoreFloats, setScoreFloats] = useState<{ id: number; text: string; ok: boolean }[]>([]);
  const [threatLevel, setThreatLevel] = useState(0);
  const [alertFlash, setAlertFlash] = useState(false);
  const [playbook, setPlaybook] = useState<PlaybookFlags>(emptyPlaybook);
  const [termLines, setTermLines] = useState<TermLine[]>([]);
  const [termInput, setTermInput] = useState("");
  const [termHistoryCmds, setTermHistoryCmds] = useState<string[]>([]);
  const [_termHistoryIdx, setTermHistoryIdx] = useState(-1);
  const termOutputRef = useRef<HTMLDivElement>(null);
  const termInputRef = useRef<HTMLInputElement>(null);
  const protocolWarnedRef = useRef(false);
  const winTriggeredRef = useRef(false);

  const pushTerm = useCallback((text: string, type: TermLineType = "output") => {
    setTermLines((prev) => [...prev.slice(-299), { id: Date.now() + Math.random(), type, text }]);
  }, []);

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

  const markPlaybook = useCallback((k: PlaybookKey) => {
    setPlaybook((prev) => (prev[k] ? prev : { ...prev, [k]: true }));
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

            const curNodeId = sc.attackPath[prevIdx] as NodeId;
            const nextNodeId = sc.attackPath[nextIdx] as NodeId;
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
            pushTerm(`[ALERT] Атакующий переместился на ${NODE_DEFS[nextNodeId].label}  -30`, "error");

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
              }, (tickSeconds * 1000) - 100);
            }

            return updated;
          });

          return prevIdx + 1;
        });

        return tickSeconds + (ipBlocked ? 2 : 0);
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [phase, scenario, ipBlocked, tickSeconds, addLog, addFloat, flashAlert, pushTerm]);

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
    const t0 = tickForMode(sc, gameMode);
    setTickSeconds(t0);
    setCountdown(t0);
    setPlaybook(emptyPlaybook());
    protocolWarnedRef.current = false;
    winTriggeredRef.current = false;
    setSelectedNode(null);
    setLogs([
      mkLog("info", `Инцидент ${sc.name} — ответные меры активированы`),
      mkLog("warn", "SIEM: аномальная активность зафиксирована"),
      mkLog("crit", `Атака типа «${sc.attackType}» — подтверждено`),
      mkLog("info", `Протокол SOC: закрой все пункты чеклиста + удержи путь к ${NODE_DEFS[sc.loseNode].label}`),
    ]);
    setScore(500);
    setElapsed(0);
    setIpBlocked(false);
    setBlockCd(0);
    setThreatLevel(15);
    setScoreFloats([]);
    setAlertFlash(false);
    const modeLine = gameMode === "training"
      ? "Режим ТРЕНИРОВКА: медленнее ход атакующего, короче КД команд, подсказка на чеклисте."
      : "Режим БОЕВОЙ: стандартные КД и темп.";
    setTermLines([
      { id: 1, type: "system", text: `SOC TERMINAL v2.1 — ${sc.name}` },
      { id: 2, type: "system", text: modeLine },
      { id: 3, type: "info",   text: "Победа только при полном чеклисте (logs, wireshark, nmap, strings, block, kill, isolate, patch) и закрытом пути." },
      { id: 4, type: "info",   text: `strings: ${sc.stringsArtifact} · patch: ${NODE_DEFS[sc.patchPlaybookNode].label}` },
      { id: 5, type: "info",   text: "Введи 'help'. Tab — узлы." },
    ]);
    setTermInput("");
    setTermHistoryCmds([]);
    setTermHistoryIdx(-1);
    setPhase("playing");
  }, [gameMode]);

  // ── Actions ─────────────────────────────────────────────────────────
  const actIsolate = useCallback((nodeId: NodeId) => {
    setNodes((prev) => {
      const n = prev[nodeId];
      if (n.cdIsolate > 0) { pushTerm(`[ERR] ${NODE_DEFS[nodeId].label}: isolate на перезарядке (${n.cdIsolate}с)`, "error"); return prev; }
      if (n.status === "isolated") { pushTerm(`[WARN] ${NODE_DEFS[nodeId].label}: уже изолирован`, "error"); return prev; }
      if (nodeId === "inet") { pushTerm(`[ERR] Нельзя изолировать внешний интернет`, "error"); return prev; }
      if (n.attacker) { pushTerm(`[ERR] На ${NODE_DEFS[nodeId].label} активен атакующий — сначала kill, затем isolate`, "error"); return prev; }
      addLog("info", `Изоляция ${NODE_DEFS[nodeId].label}: узел отключён от сети`);
      pushTerm(`[OK] ${NODE_DEFS[nodeId].label} изолирован — входящие/исходящие соединения разорваны  +120`, "output");
      addFloat("+120", true);
      setScore((s) => s + 120);
      setThreatLevel((t) => Math.max(0, t - 15));
      markPlaybook("isolate");
      return {
        ...prev,
        [nodeId]: { ...n, status: "isolated", attacker: false, cdIsolate: cooldownSec(20, gameMode) },
      };
    });
  }, [addLog, addFloat, pushTerm, markPlaybook, gameMode]);

  const actKillProc = useCallback((nodeId: NodeId) => {
    setNodes((prev) => {
      const n = prev[nodeId];
      if (n.cdKill > 0) { pushTerm(`[ERR] kill: команда на перезарядке (${n.cdKill}с)`, "error"); return prev; }
      if (!n.attacker) { pushTerm(`[WARN] kill: атакующего нет на ${NODE_DEFS[nodeId].label}`, "error"); return prev; }
      addLog("warn", `Завершение процессов на ${NODE_DEFS[nodeId].label} — атакующий выбит`);
      pushTerm(`[OK] Процессы на ${NODE_DEFS[nodeId].label} завершены — атакующий отброшен назад  +60`, "output");
      addFloat("+60", true);
      setScore((s) => s + 60);
      markPlaybook("kill");
      // Push attacker back one step
      if (scenario) {
        setAttackerIdx((ai) => {
          const prevNodeId = scenario.attackPath[ai - 1];
          if (prevNodeId) {
            setNodes((p2) => ({
              ...p2,
              [nodeId]: { ...p2[nodeId], attacker: false, status: "compromised", cdKill: cooldownSec(14, gameMode) },
              [prevNodeId]: { ...p2[prevNodeId], attacker: true },
            }));
          }
          return Math.max(0, ai - 1);
        });
      }
      return prev;
    });
  }, [addLog, addFloat, pushTerm, scenario, markPlaybook, gameMode]);

  const actBlockIp = useCallback(() => {
    if (blockCd > 0) { pushTerm(`[ERR] block: правило на перезарядке (${blockCd}с)`, "error"); return; }
    if (ipBlocked) { pushTerm("[WARN] block: IP 203.45.178.92 уже заблокирован", "error"); return; }
    setIpBlocked(true);
    setBlockCd(cooldownSec(18, gameMode));
    addLog("info", "Firewall rule добавлено — IP 203.45.178.92 заблокирован. +2 сек/шаг");
    pushTerm("[OK] iptables -A INPUT -s 203.45.178.92 -j DROP — правило активно  +40", "output");
    addFloat("+40", true);
    setScore((s) => s + 40);
    setThreatLevel((t) => Math.max(0, t - 10));
    markPlaybook("block");
  }, [blockCd, ipBlocked, addLog, addFloat, pushTerm, markPlaybook, gameMode]);

  const actPatch = useCallback((nodeId: NodeId) => {
    setNodes((prev) => {
      const n = prev[nodeId];
      if (scenario && nodeId !== scenario.patchPlaybookNode) {
        pushTerm(`[ERR] По протоколу патч только на ${NODE_DEFS[scenario.patchPlaybookNode].label} (${scenario.patchPlaybookNode})`, "error");
        return prev;
      }
      if (n.cdPatch > 0) { pushTerm(`[ERR] patch: на перезарядке (${n.cdPatch}с)`, "error"); return prev; }
      if (n.attacker) { pushTerm(`[ERR] patch: нельзя патчить узел пока атакующий активен — сначала kill`, "error"); return prev; }
      if (n.status === "clean" || n.status === "defended") { pushTerm(`[WARN] patch: ${NODE_DEFS[nodeId].label} не требует патча (статус: ${STATUS_LABEL[n.status]})`, "error"); return prev; }
      if (n.status === "isolated") { pushTerm(`[WARN] patch: ${NODE_DEFS[nodeId].label} изолирован — снять изоляцию перед патчем невозможно в бою`, "error"); return prev; }
      addLog("info", `Патч применён на ${NODE_DEFS[nodeId].label} — уязвимость устранена`);
      pushTerm(`[OK] ${NODE_DEFS[nodeId].label}: патч установлен — узел защищён  +100`, "output");
      addFloat("+100", true);
      setScore((s) => s + 100);
      markPlaybook("patch");
      return {
        ...prev,
        [nodeId]: { ...n, status: "defended", cdPatch: cooldownSec(25, gameMode) },
      };
    });
  }, [addLog, addFloat, pushTerm, scenario, markPlaybook, gameMode]);

  const actCheckLogs = useCallback((nodeId: NodeId) => {
    if (!scenario) return;
    const logs_ = scenario.arrivalLogs[nodeId] ?? [];
    if (logs_.length === 0) {
      addLog("info", `${NODE_DEFS[nodeId].label}: подозрительной активности не обнаружено`);
      pushTerm(`[SCAN] ${NODE_DEFS[nodeId].label}: IoC не обнаружено  +10`, "output");
    } else {
      addLog("warn", `Анализ ${NODE_DEFS[nodeId].label} — обнаружены индикаторы компрометации:`);
      pushTerm(`[SCAN] ${NODE_DEFS[nodeId].label} — найдены индикаторы компрометации:`, "info");
      for (const l of logs_) { addLog("crit", `  › ${l}`); pushTerm(`  ⚠ ${l}`, "error"); }
      pushTerm(`  +10`, "output");
    }
    markPlaybook("logs");
    addFloat("+10", true);
    setScore((s) => s + 10);
  }, [scenario, addLog, addFloat, pushTerm, markPlaybook]);

  const processCommand = useCallback((raw: string) => {
    const line = raw.trim();
    if (!line) return;
    pushTerm(`soc@defender:~$ ${line}`, "input");
    const parts = line.toLowerCase().split(/\s+/);
    const cmd = parts[0] ?? "";
    const argRaw = parts[1];
    const arg = argRaw as NodeId | undefined;

    const needNode = (): NodeId | null => {
      if (!arg || !(ALL_NODE_IDS as string[]).includes(arg)) {
        pushTerm(`Ошибка: укажи узел. Доступные: ${ALL_NODE_IDS.join("  ")}`, "error");
        return null;
      }
      return arg as NodeId;
    };

    switch (cmd) {
      case "help": {
        pushTerm("Доступные команды:", "info");
        pushTerm("  isolate <node>   — изолировать узел от сети           [КД 20с]");
        pushTerm("  kill <node>      — завершить вредоносный процесс      [КД 14с]");
        pushTerm("  block            — заблокировать IP атакующего        [КД 18с]");
        pushTerm("  patch <node>     — применить патч безопасности        [КД 25с]");
        pushTerm("  logs <node>      — просмотреть логи / IoC узла (чеклист)");
        pushTerm(`  wireshark <node> — дамп трафика (чеклист)`);
        pushTerm(`  nmap <subnet>    — скан (${NMAP_SUBNET}, corp.lan …) (чеклист)`);
        pushTerm("  strings <file>   — строки артефакта (нужный файл в брифинге)");
        pushTerm("  Победа: весь чеклист + изоляция/патч на всём пути к цели.");
        pushTerm("  status           — состояние всех узлов сети");
        pushTerm("  abort            — прервать миссию");
        pushTerm("  clear            — очистить терминал");
        break;
      }
      case "status": {
        pushTerm("━━ Статус сети ━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
        for (const id of ALL_NODE_IDS) {
          const n = nodes[id];
          const def = NODE_DEFS[id];
          const atk = n.attacker ? "  ☠ АТАКУЮЩИЙ" : "";
          pushTerm(`  ${def.label.padEnd(10)} [${STATUS_LABEL[n.status]}]${atk}`);
        }
        break;
      }
      case "isolate":
      case "iso": {
        const id = needNode(); if (!id) break;
        actIsolate(id);
        break;
      }
      case "kill":
      case "killproc": {
        const id = needNode(); if (!id) break;
        actKillProc(id);
        break;
      }
      case "block":
      case "blockip": {
        actBlockIp();
        break;
      }
      case "patch": {
        const id = needNode(); if (!id) break;
        actPatch(id);
        break;
      }
      case "logs":
      case "scan":
      case "check": {
        const id = needNode(); if (!id) break;
        actCheckLogs(id);
        break;
      }
      case "wireshark":
      case "tshark": {
        const id = needNode(); if (!id) break;
        if (!scenario) break;
        emitWiresharkCapture(scenario.id, id, pushTerm);
        markPlaybook("wireshark");
        break;
      }
      case "nmap": {
        const subArg = argRaw;
        if (!subArg) {
          pushTerm(`Ошибка: укажи подсеть. Пример: nmap ${NMAP_SUBNET}  или  nmap corp.lan`, "error");
          break;
        }
        if (!normalizeNmapSubnet(subArg)) {
          pushTerm(`Неизвестная подсеть. Доступно: ${NMAP_SUBNET}, corp.lan, internal`, "error");
          break;
        }
        if (!scenario) break;
        emitNmapScan(scenario.id, pushTerm);
        markPlaybook("nmap");
        break;
      }
      case "strings": {
        const rawParts = line.split(/\s+/).filter(Boolean);
        const fileArg = rawParts.slice(1).join(" ");
        if (!fileArg) {
          pushTerm("Ошибка: укажи путь к файлу. Пример: strings /var/www/.svc.php  или  strings dropper.bin", "error");
          break;
        }
        const key = resolveStringsPath(fileArg);
        if (!key) {
          pushTerm(`Файл не в симуляции. Доступны: ${Object.keys(STRINGS_FILES).join(", ")}`, "error");
          break;
        }
        emitStringsDump(key, pushTerm);
        if (scenario && normStringsKey(key) === normStringsKey(scenario.stringsArtifact)) {
          markPlaybook("strings");
        } else {
          pushTerm(`[SOC] Для чеклиста нужен артефакт сценария: ${scenario?.stringsArtifact ?? "—"}`, "error");
        }
        break;
      }
      case "clear": {
        setTermLines([]);
        return;
      }
      case "abort": {
        setPhase("select");
        break;
      }
      default:
        pushTerm(`Команда не найдена: ${cmd}. Введи 'help' для списка.`, "error");
    }
  }, [nodes, scenario, pushTerm, actIsolate, actKillProc, actBlockIp, actPatch, actCheckLogs, markPlaybook]);

  const handleTermKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = termInput.trim();
      if (val) {
        setTermHistoryCmds((h) => [val, ...h].slice(0, 50));
        setTermHistoryIdx(-1);
        processCommand(val);
      }
      setTermInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setTermHistoryIdx((i) => {
        const next = Math.min(i + 1, termHistoryCmds.length - 1);
        setTermInput(termHistoryCmds[next] ?? "");
        return next;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setTermHistoryIdx((i) => {
        const next = Math.max(i - 1, -1);
        setTermInput(next === -1 ? "" : termHistoryCmds[next] ?? "");
        return next;
      });
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Autocomplete node ids
      if (termInput) {
        const lastWord = termInput.split(" ").pop() ?? "";
        const match = ALL_NODE_IDS.find((id) => id.startsWith(lastWord) && id !== lastWord);
        if (match) {
          setTermInput(termInput.slice(0, termInput.lastIndexOf(lastWord)) + match);
        }
      }
    }
  }, [termInput, termHistoryCmds, processCommand]);

  // Auto-scroll terminal output
  useEffect(() => {
    if (termOutputRef.current) {
      termOutputRef.current.scrollTop = termOutputRef.current.scrollHeight;
    }
  }, [termLines.length]);

  const triggerWin = useCallback(() => {
    addLog("info", "ПРОТОКОЛ SOC ЗАКРЫТ — путь удержан, чеклист выполнен");
    pushTerm("━━ МИССИЯ ВЫПОЛНЕНА ━━━━━━━━━━━━━━━━━━━━━━", "system");
    pushTerm("Инцидент закрыт: расследование и реагирование по чеклисту завершены.", "system");
    setScore((s) => s + elapsed > 0 ? s + Math.floor(300 / Math.max(elapsed, 1) * 60) : s);
    setPhase("won");
  }, [addLog, pushTerm, elapsed]);

  // Подсказка, если сеть удержана, но чеклист не полон
  useEffect(() => {
    if (phase !== "playing" || !scenario) return;
    const loseN = nodes[scenario.loseNode];
    const allPathOk = scenario.attackPath.every((id) => {
      const n = nodes[id];
      return n.status === "isolated" || n.status === "defended" || id === "inet";
    });
    if (!allPathOk || loseN.attacker) {
      protocolWarnedRef.current = false;
      return;
    }
    if (!playbookComplete(playbook) && !protocolWarnedRef.current) {
      protocolWarnedRef.current = true;
      addLog("warn", "Путь удерживается, но инцидент не закрыт — выполни все пункты чеклиста SOC.");
      pushTerm("[SOC] Заверши чеклист (строка под HUD): без этого отчёт не принимается.", "error");
    }
  }, [nodes, phase, scenario, playbook, addLog, pushTerm]);

  // Победа: путь закрыт + нет атакующего на цели + полный чеклист
  useEffect(() => {
    if (phase !== "playing" || !scenario) return;
    const loseN = nodes[scenario.loseNode];
    const allPathOk = scenario.attackPath.every((id) => {
      const n = nodes[id];
      return n.status === "isolated" || n.status === "defended" || id === "inet";
    });
    if (allPathOk && !loseN.attacker && playbookComplete(playbook)) {
      if (winTriggeredRef.current) return;
      winTriggeredRef.current = true;
      triggerWin();
    }
  }, [nodes, phase, scenario, playbook, triggerWin]);

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
              Два режима: тренировка (медленнее, подсказки) и боевой. Победа только после полного протокола SOC —
              все команды расследования и реагирования из чеклиста, затем удержание пути к цели.
            </p>
          </div>

          <div className="defender-mode-bar" role="group" aria-label="Режим игры">
            <button
              type="button"
              className={`defender-mode-btn${gameMode === "training" ? " defender-mode-btn--active" : ""}`}
              onClick={() => setGameMode("training")}
            >
              ТРЕНИРОВКА
            </button>
            <button
              type="button"
              className={`defender-mode-btn${gameMode === "combat" ? " defender-mode-btn--active" : ""}`}
              onClick={() => setGameMode("combat")}
            >
              БОЕВОЙ
            </button>
            <p className="defender-mode-hint">
              {gameMode === "training"
                ? "Длинный интервал хода, короткие КД, подсветка следующего шага чеклиста."
                : "Стандартный темп. Чеклист обязателен и в бою."}
            </p>
          </div>

          <div className="defender-scenario-grid">
            {SCENARIOS.map((sc) => {
              const tCombat = tickForMode(sc, "combat");
              const tTrain = tickForMode(sc, "training");
              return (
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
                  <span className="defender-scenario-interval">⏱ ход ~{tCombat}с боевой · ~{tTrain}с трен.</span>
                  <span className="defender-scenario-start-hint">ВЫБРАТЬ →</span>
                </div>
              </button>
            );})}
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
            <h3 className="defender-briefing-legend-title">Протокол закрытия инцидента</h3>
            <p className="defender-briefing-protocol-hint">
              Режим: <strong>{gameMode === "training" ? "тренировка" : "боевой"}</strong>.
              Обязательны все пункты чеклиста в игре + удержание пути. Артефакт для <code className="defender-briefing-code">strings</code>:{" "}
              <code className="defender-briefing-code">{scenario.stringsArtifact}</code>.
              Патч только на <strong>{NODE_DEFS[scenario.patchPlaybookNode].label}</strong>. Изоляция узла с активным атакующим запрещена без предварительного <strong>kill</strong>.
            </p>
            <div className="defender-briefing-actions-list">
              {[
                { key: "ЧЕКЛИСТ", desc: "logs, wireshark, nmap, strings (файл выше), block, kill, isolate, patch — каждый минимум раз", cd: "—" },
                { key: "ИЗОЛИРОВАТЬ", desc: "Только если на узле нет активного атакующего (иначе сначала kill)", cd: "20с" },
                { key: "KILL", desc: "Сбросить сессию противника на текущем узле", cd: "14с" },
                { key: "BLOCK IP", desc: "Замедлить ход атакующего (+2 с к таймеру)", cd: "18с" },
                { key: "ПАТЧ", desc: `Только узел ${NODE_DEFS[scenario.patchPlaybookNode].label} после kill`, cd: "25с" },
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
              ? "Чеклист расследования и реагирования закрыт, путь к цели удержан."
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
          <div className="defender-hud-title-row">
            <span className="defender-hud-scenario" style={{ color: scenario.diffColor }}>
              {scenario.name}
            </span>
            <span className={`defender-hud-badge${gameMode === "training" ? " defender-hud-badge--train" : ""}`}>
              {gameMode === "training" ? "ТРЕНИРОВКА" : "БОЕВОЙ"}
            </span>
          </div>
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
        <PlaybookBar flags={playbook} training={gameMode === "training"} />
      </div>

      {/* ── Main content ── */}
      <div className="defender-main">
        {/* Network map — click node to paste id into terminal */}
        <div className="defender-map-wrap">
          <NetworkSvg
            nodes={nodes}
            selectedNode={selectedNode}
            onSelect={(id) => {
              setSelectedNode(id);
              // Paste node id at end of current input (after command word if present)
              setTermInput((prev) => {
                const parts = prev.trim().split(/\s+/);
                if (parts.length <= 1) return `${parts[0] ?? ""} ${id}`.trim();
                parts[parts.length - 1] = id;
                return parts.join(" ");
              });
              termInputRef.current?.focus();
            }}
          />
        </div>

        {/* Log panel */}
        <LogPanel logs={logs} />
      </div>

      {/* ── SOC Terminal ── */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div
        className="def-terminal"
        onClick={() => termInputRef.current?.focus()}
        role="region"
        aria-label="SOC Terminal"
      >
        <div className="def-terminal-header">
          <div className="def-terminal-header-dots">
            <span className="def-dot def-dot--r" />
            <span className="def-dot def-dot--y" />
            <span className="def-dot def-dot--g" />
          </div>
          <span className="def-terminal-title">SOC TERMINAL</span>
          <span className="def-terminal-hint">help · wireshark · nmap · strings · Tab · ↑↓</span>
          <button
            type="button"
            className="def-terminal-abort"
            onClick={(e) => { e.stopPropagation(); setPhase("select"); }}
          >
            ✕ abort
          </button>
        </div>

        <div className="def-terminal-output" ref={termOutputRef}>
          {termLines.map((l) => (
            <div key={l.id} className={`def-terminal-line def-terminal-line--${l.type}`}>
              {l.text}
            </div>
          ))}
        </div>

        <div className="def-terminal-input-row">
          <span className="def-terminal-prompt">soc@defender:~$</span>
          <input
            ref={termInputRef}
            className="def-terminal-input"
            value={termInput}
            onChange={(e) => setTermInput(e.target.value)}
            onKeyDown={handleTermKey}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Ввод команды"
          />
          <span className="def-terminal-cursor" aria-hidden />
        </div>
      </div>
    </div>
  );
}
