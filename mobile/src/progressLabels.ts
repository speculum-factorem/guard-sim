export function levelFromExperience(exp: number): number {
  return Math.floor(Math.max(0, exp) / 100) + 1;
}

export function xpIntoCurrentLevel(exp: number): number {
  return Math.max(0, exp) % 100;
}

export function levelLabel(level: number): string {
  return `Уровень ${level}`;
}

export function experienceSummary(exp: number): string {
  const lvl = levelFromExperience(exp);
  const inLvl = xpIntoCurrentLevel(exp);
  const toNext = 100 - inLvl;
  return `${exp} XP · ${levelLabel(lvl)} · до следующего уровня: ${toNext} XP`;
}
