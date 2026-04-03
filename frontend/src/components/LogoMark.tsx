import { useId } from "react";

type LogoMarkProps = {
  className?: string;
  /** Размер в пикселях (ширина и высота) */
  size?: number;
  title?: string;
};

/**
 * Знак GuardSim: скруглённый квадрат, градиент оранжевый → мятный, галочка, обводка «bento».
 */
export function LogoMark({ className = "", size = 40, title = "GuardSim" }: LogoMarkProps) {
  const raw = useId().replace(/:/g, "");
  const gradId = `logo-grad-${raw}`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff5f1f" />
          <stop offset="55%" stopColor="#ffdb58" />
          <stop offset="100%" stopColor="#70dbaf" />
        </linearGradient>
      </defs>
      <rect
        x="2.5"
        y="2.5"
        width="35"
        height="35"
        rx="10"
        fill={`url(#${gradId})`}
        stroke="#0a0a0a"
        strokeWidth="3"
      />
      <path
        d="M11 20.5 L17.5 27 L29 13.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
