/** Координаты в viewBox 0–100 для SVG-дорожки челленджа */

export interface RoadPoint {
  x: number;
  y: number;
}

export function buildRoadPoints(stepCount: number): RoadPoint[] {
  if (stepCount <= 0) {
    return [];
  }
  if (stepCount === 1) {
    return [{ x: 50, y: 50 }];
  }
  const points: RoadPoint[] = [];
  for (let i = 0; i < stepCount; i++) {
    const t = i / (stepCount - 1);
    const y = 8 + t * 84;
    const x = i % 2 === 0 ? 22 : 78;
    points.push({ x, y });
  }
  return points;
}

/** Плавная «шоссе»-линия между точками (кубические Безье через середину по Y) */
export function buildRoadPathD(points: RoadPoint[]): string {
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    const p = points[0]!;
    return `M ${p.x} ${p.y}`;
  }
  const first = points[0]!;
  let d = `M ${first.x} ${first.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const mx = (p0.x + p1.x) / 2;
    d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}
