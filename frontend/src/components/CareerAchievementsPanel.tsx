import { CHALLENGE_TRACKS } from "../challengeTracks";
import { getCompletedTracks } from "../challengeTrackProgress";
import { levelLabel, xpIntoCurrentLevel } from "../progressLabels";
import type { PlayerState } from "../types";

export function CareerAchievementsPanel({ player }: { player: PlayerState }) {
  const completed = new Set(player.completedScenarioIds);
  const tracksDone = getCompletedTracks(CHALLENGE_TRACKS, completed);
  const xpInLevel = xpIntoCurrentLevel(player.experience);

  return (
    <section className="career-panel dashboard-career" aria-label="Прогресс и достижения">
      <div className="career-panel-row">
        <div className="career-role-pill">
          <span className="career-role-label">Уровень</span>
          <strong>{levelLabel(player.level)}</strong>
        </div>
        <div className="career-rep">
          <div className="career-rep-head">
            <span>Опыт</span>
            <strong>{player.experience} XP</strong>
          </div>
          <div className="career-rep-track" aria-hidden title={`Прогресс внутри уровня: ${xpInLevel}/100`}>
            <div className="career-rep-fill" style={{ width: `${xpInLevel}%` }} />
          </div>
        </div>
        <div className="career-rep">
          <div className="career-rep-head">
            <span>Доверие клиентов</span>
            <strong>{player.reputation}%</strong>
          </div>
          <div className="career-rep-track" aria-hidden>
            <div className="career-rep-fill" style={{ width: `${player.reputation}%` }} />
          </div>
        </div>
        <div className="career-streak">
          <span className="career-streak-label">Идеальные сценарии подряд</span>
          <strong>{player.perfectScenarioStreak}</strong>
        </div>
      </div>
      {tracksDone.length > 0 ? (
        <div className="challenge-tracks-done" aria-label="Пройденные дорожки челленджей">
          <h2 className="challenge-tracks-done-title">Дорожки челленджей</h2>
          <ul className="challenge-tracks-done-list">
            {tracksDone.map((t) => (
              <li key={t.id} className={`challenge-tracks-done-badge challenge-tracks-done-badge--${t.accent}`}>
                <span className="challenge-tracks-done-icon" aria-hidden>
                  ✓
                </span>
                <span className="challenge-tracks-done-label">Пройдена дорожка «{t.title}»</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="achievements-block">
        <h2 className="achievements-title">Бейджи и достижения</h2>
        <ul className="achievements-list">
          {player.achievements.map((a) => (
            <li key={a.id} className={a.unlocked ? "ach-unlocked" : "ach-locked"}>
              <span className="ach-icon" aria-hidden>
                {a.unlocked ? "★" : "○"}
              </span>
              <div>
                <div className="ach-name">{a.title}</div>
                <div className="ach-desc">{a.description}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
