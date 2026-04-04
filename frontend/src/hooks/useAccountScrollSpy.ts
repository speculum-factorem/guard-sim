import { useEffect, useState } from "react";

/**
 * Подсветка пункта бокового меню по видимой секции (IntersectionObserver).
 */
export function useAccountScrollSpy(sectionIds: readonly string[], enabled: boolean): string {
  const [activeId, setActiveId] = useState(() => sectionIds[0] ?? "");

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) {
      return;
    }
    const nodes = sectionIds.map((id) => document.getElementById(id)).filter((n): n is HTMLElement => n != null);
    if (nodes.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting && e.target.id);
        if (visible.length === 0) {
          return;
        }
        const best = visible.reduce((a, b) =>
          b.intersectionRatio > a.intersectionRatio ? b : a,
        );
        const id = best.target.id;
        if (id) {
          setActiveId(id);
        }
      },
      {
        root: null,
        rootMargin: "-56px 0px -35% 0px",
        threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.75, 1],
      },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [enabled, sectionIds]);

  return activeId;
}
