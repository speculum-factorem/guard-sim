package com.guardsim.player

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "players")
class PlayerEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var clientId: UUID = UUID.randomUUID(),
    @Column(nullable = false)
    var reputation: Int = 72,
    /** Накопленный опыт; уровень считается как (experience / 100) + 1 */
    @Column(nullable = false)
    var experiencePoints: Int = 0,
    /** Идентификаторы сценариев, завершённых хотя бы раз, через запятую */
    @Column(nullable = false, length = 4000)
    var completedScenarioIdsCsv: String = "",
    @Column(nullable = false, length = 4000)
    var achievementIdsCsv: String = "",
    @Column(nullable = false)
    var perfectScenarioStreak: Int = 0,
    /** Понедельник учётной недели для недельной цели (YYYY-MM-DD) */
    @Column(nullable = true, length = 16)
    var weeklyGoalWeekStart: String? = null,
    @Column(nullable = false)
    var weeklyGoalCount: Int = 0,
)
