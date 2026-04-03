import { careerTitle } from "../careerLabels";
import type { PlayerState } from "../types";

export function CareerAchievementsPanel({ player }: { player: PlayerState }) {
  return (
    <section className="career-panel dashboard-career" aria-label="Карьера и достижения">
      <div className="career-panel-row">
        <div className="career-role-pill">
          <span className="career-role-label">Роль</span>
          <strong>{careerTitle(player.role)}</strong>
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
      <div className="achievements-block">
        <h2 className="achievements-title">Дневник достижений</h2>
        <ul className="achievements-list">
          {player.achievements.map((a) => (
            <li key={a.id} className={a.unlocked ? "ach-unlocked" : "ach-locked"}>
              <span className="ach-icon" aria-hidden>
                {a.unlocked ? "✓" : "○"}
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
