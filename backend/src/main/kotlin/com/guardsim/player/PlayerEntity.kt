package com.guardsim.player

import com.guardsim.career.CareerRole
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
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
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var role: CareerRole = CareerRole.INTERN,
    /** Идентификаторы сценариев, завершённых хотя бы раз, через запятую */
    @Column(nullable = false, length = 4000)
    var completedScenarioIdsCsv: String = "",
    @Column(nullable = false, length = 4000)
    var achievementIdsCsv: String = "",
    @Column(nullable = false)
    var perfectScenarioStreak: Int = 0,
)
