import type { Hotspot, StepPublic } from "../../types";

export function hotspotByVariant(step: StepPublic, variant: string): Hotspot | undefined {
  const v = variant.toUpperCase();
  return step.hotspots.find((h) => h.variant.toUpperCase() === v);
}
