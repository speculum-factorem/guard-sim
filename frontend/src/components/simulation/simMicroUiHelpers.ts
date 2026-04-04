/** Извлечь email из строки вида `Имя <a@b.c>` или голый адрес */
export function extractEmailFromHeader(from: string): string {
  const t = from.trim();
  const angled = t.match(/<([^>]+)>/);
  const inner = angled?.[1];
  if (inner !== undefined) {
    return inner.trim();
  }
  const plain = t.match(/[^\s<>]+@[^\s<>]+\.[^\s<>]+/);
  return plain ? plain[0] : t;
}

/** Синтетический Reply-To для учебной демонстрации (может отличаться от From). */
export function syntheticReplyTo(stepId: string, from: string): { address: string; suspicious: boolean } {
  const base = extractEmailFromHeader(from);
  const suspicious = (stepId.length + base.length) % 3 !== 0;
  if (!suspicious) {
    return { address: base, suspicious: false };
  }
  const domain = base.includes("@") ? base.split("@")[1] ?? "example.com" : "example.com";
  return {
    address: `billing-notice@${domain.startsWith("secure.") ? domain : `secure.${domain}`}`,
    suspicious: true,
  };
}

/** Псевдослучайное число из id шага (стабильно для одного шага). */
export function seedFromStepId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Посимвольное сравнение двух строк для подсветки отличий в URL. */
export function urlCharDiffPair(left: string, right: string): {
  left: { char: string; diff: boolean }[];
  right: { char: string; diff: boolean }[];
} {
  const n = Math.max(left.length, right.length);
  const l: { char: string; diff: boolean }[] = [];
  const r: { char: string; diff: boolean }[] = [];
  for (let i = 0; i < n; i++) {
    const lc = left[i] ?? "";
    const rc = right[i] ?? "";
    const diff = lc !== rc;
    l.push({ char: lc, diff });
    r.push({ char: rc, diff });
  }
  return { left: l, right: r };
}
