package com.guardsim.auth

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "users")
class UserEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @Column(nullable = false, unique = true, length = 255)
    var email: String = "",
    @Column(nullable = false, length = 120)
    var passwordHash: String = "",
    /** Профиль игрока (прогресс) */
    @Column(nullable = false, updatable = false)
    val playerClientId: UUID = UUID.randomUUID(),
)
