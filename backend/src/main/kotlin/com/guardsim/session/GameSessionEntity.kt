package com.guardsim.session

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "game_sessions")
class GameSessionEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: UUID = UUID.randomUUID(),
    @Column(nullable = false, length = 64)
    var scenarioId: String = "",
    @Column(nullable = false)
    var currentStepIndex: Int = 0,
    @Column(nullable = false)
    var score: Int = 0,
    @Column(nullable = false)
    var completed: Boolean = false,
    @Column(nullable = true)
    var playerClientId: UUID? = null,
    @Column(nullable = false)
    var hadIncorrectStep: Boolean = false,
)
