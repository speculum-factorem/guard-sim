package com.guardsim.session

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface GameSessionRepository : JpaRepository<GameSessionEntity, UUID>
