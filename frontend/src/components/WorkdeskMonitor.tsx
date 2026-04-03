import type { ScenarioSummary } from "../types";
import { ScenarioProblemTable } from "./ScenarioProblemTable";

export function WorkdeskMonitor(props: {
  items: ScenarioSummary[];
  completedIds: string[];
}) {
  return (
    <div className="lc-theme">
      <ScenarioProblemTable items={props.items} completedIds={props.completedIds} />
    </div>
  );
}
