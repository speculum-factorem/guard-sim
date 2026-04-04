package com.guardsim.session

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional
import java.util.UUID

interface GameSessionRepository : JpaRepository<GameSessionEntity, UUID> {
    fun findFirstByPlayerClientIdAndScenarioIdAndCompletedIsFalseOrderByIdDesc(
        playerClientId: UUID,
        scenarioId: String,
    ): Optional<GameSessionEntity>

    fun deleteByPlayerClientIdAndScenarioIdAndCompletedIsFalse(playerClientId: UUID, scenarioId: String)
}
