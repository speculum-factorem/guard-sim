import type { ReactNode } from "react";
import type { ChoicePublic, StepPublic } from "../../types";
import { NarrativeNoiseBlock } from "./NarrativeNoiseBlock";
import { OrphanHotspotRow } from "./OrphanHotspotRow";

export function GenericWorkspaceSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  /** Варианты ответа, если нет хотспотов (обычно все варианты шага) */
  choiceButtons: ChoicePublic[];
  childrenFooter?: ReactNode;
}) {
  const { step, disabled, onChoose, choiceButtons, childrenFooter } = props;
  const noise = step.narrativeNoise ? <NarrativeNoiseBlock text={step.narrativeNoise} /> : null;
  const useHotspots = step.hotspots.length > 0;

  return (
    <div className="ui-frame sim-generic-workspace">
      <div className="sim-generic-chrome">
        <span className="sim-generic-title">Задание</span>
        <span className="sim-generic-badge">GuardSim</span>
      </div>
      <div className="sim-generic-body">
        <div className="narrative sim-generic-narrative">{step.narrative}</div>
        {noise}
        {useHotspots ? (
          <OrphanHotspotRow hotspots={step.hotspots} disabled={disabled} onChoose={onChoose} />
        ) : (
          <div className="sim-generic-actions" role="group" aria-label="Варианты ответа">
            {choiceButtons.map((c) => (
              <button
                key={c.id}
                type="button"
                className="choice-btn sim-generic-choice"
                disabled={disabled}
                onClick={() => onChoose(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        {childrenFooter}
      </div>
    </div>
  );
}
