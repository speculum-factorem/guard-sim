import type { ChallengeTrackDef } from "./challengeTracks";
import type { ScenarioSummary } from "./types";

export function isTrackFullyCompleted(track: ChallengeTrackDef, completed: ReadonlySet<string>): boolean {
  return track.scenarioIds.length > 0 && track.scenarioIds.every((id) => completed.has(id));
}

export function getCompletedTracks(tracks: readonly ChallengeTrackDef[], completed: ReadonlySet<string>): ChallengeTrackDef[] {
  return tracks.filter((t) => isTrackFullyCompleted(t, completed));
}

/** Первый непройденный шаг по порядку дорожек (как в CHALLENGE_TRACKS). */
export function getNextIncompleteTrackStep(
  tracks: readonly ChallengeTrackDef[],
  completed: ReadonlySet<string>,
  byId: ReadonlyMap<string, ScenarioSummary>,
): { track: ChallengeTrackDef; scenario: ScenarioSummary; stepNumber: number } | null {
  for (const track of tracks) {
    for (let i = 0; i < track.scenarioIds.length; i++) {
      const sid = track.scenarioIds[i]!;
      if (completed.has(sid)) {
        continue;
      }
      const s = byId.get(sid);
      if (!s) {
        continue;
      }
      return { track, scenario: s, stepNumber: i + 1 };
    }
  }
  return null;
}

export function areAllTracksCompleted(tracks: readonly ChallengeTrackDef[], completed: ReadonlySet<string>): boolean {
  return tracks.length > 0 && tracks.every((t) => isTrackFullyCompleted(t, completed));
}
