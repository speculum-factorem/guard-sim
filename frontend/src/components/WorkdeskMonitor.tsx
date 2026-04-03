import type { ScenarioSummary } from "../types";
import { ScenarioProblemTable } from "./ScenarioProblemTable";

export function WorkdeskMonitor(props: {
  items: ScenarioSummary[];
  completedIds: string[];
}) {
  return <ScenarioProblemTable items={props.items} completedIds={props.completedIds} />;
}
