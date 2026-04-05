import { useEffect, useState } from "react";

/** Совпадает с `.account-panel { scroll-margin-top }` — линия «секция уже под шапкой». */
const ACTIVATION_TOP_PX = 88;

/**
 * Подсветка пункта бокового меню по положению прокрутки: активна последняя секция,
 * чей верх уже не выше линии под фиксированной шапкой (как в документации / LeetCode).
 */
export function useAccountScrollSpy(sectionIds: readonly string[], enabled: boolean): string {
  const [activeId, setActiveId] = useState(() => sectionIds[0] ?? "");

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) {
      return;
    }

    const compute = () => {
      let current = sectionIds[0] ?? "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) {
          continue;
        }
        const top = el.getBoundingClientRect().top;
        if (top <= ACTIVATION_TOP_PX) {
          current = id;
        }
      }

      const lastId = sectionIds[sectionIds.length - 1];
      if (lastId) {
        const lastEl = document.getElementById(lastId);
        if (lastEl) {
          const scrollBottom = window.scrollY + window.innerHeight;
          const docHeight = document.documentElement.scrollHeight;
          const nearBottom = scrollBottom >= docHeight - 24;
          const lastTop = lastEl.getBoundingClientRect().top;
          if (nearBottom && lastTop < window.innerHeight) {
            current = lastId;
          }
        }
      }

      setActiveId((prev) => (prev === current ? prev : current));
    };

    compute();

    let raf = 0;
    const schedule = () => {
      if (raf !== 0) {
        return;
      }
      raf = requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      if (raf !== 0) {
        cancelAnimationFrame(raf);
      }
    };
  }, [enabled, sectionIds]);

  return activeId;
}
