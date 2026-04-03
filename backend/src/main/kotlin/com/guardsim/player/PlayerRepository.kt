package com.guardsim.player

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface PlayerRepository : JpaRepository<PlayerEntity, UUID>
