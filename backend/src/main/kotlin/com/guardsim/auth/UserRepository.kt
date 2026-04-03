package com.guardsim.auth

import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional
import java.util.UUID

interface UserRepository : JpaRepository<UserEntity, UUID> {
    fun findByEmailIgnoreCase(email: String): Optional<UserEntity>

    fun findByPlayerClientId(playerClientId: UUID): Optional<UserEntity>
}
