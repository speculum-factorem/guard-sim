import type { Hotspot } from "../../types";

export function OrphanHotspotRow(props: {
  hotspots: Hotspot[];
  disabled: boolean;
  onChoose: (choiceId: string) => void;
}) {
  const { hotspots, disabled, onChoose } = props;
  if (hotspots.length === 0) {
    return null;
  }
  return (
    <div className="hotspot-row hotspot-row-orphan">
      {hotspots.map((h) => (
        <button
          key={h.id}
          type="button"
          className={`hotspot-chip hotspot-variant-${h.variant.toLowerCase()}`}
          disabled={disabled}
          onClick={() => onChoose(h.choiceId)}
        >
          {h.label}
        </button>
      ))}
    </div>
  );
}
