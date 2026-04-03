package com.guardsim.auth

import com.guardsim.dto.AuthResponseDto
import com.guardsim.dto.UserMeDto
import com.guardsim.config.JwtProperties
import com.guardsim.player.PlayerEntity
import com.guardsim.player.PlayerRepository
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class AuthService(
    private val users: UserRepository,
    private val players: PlayerRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
    private val jwtProperties: JwtProperties,
) {

    @Transactional
    fun register(email: String, password: String): AuthResponseDto {
        val normalized = email.lowercase().trim()
        if (users.findByEmailIgnoreCase(normalized).isPresent) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Этот email уже зарегистрирован")
        }
        val playerId = UUID.randomUUID()
        players.save(PlayerEntity(clientId = playerId))
        val hash = passwordEncoder.encode(password)
        users.save(
            UserEntity(
                email = normalized,
                passwordHash = hash,
                playerClientId = playerId,
            ),
        )
        return buildAuthResponse(normalized, playerId)
    }

    fun login(email: String, password: String): AuthResponseDto {
        val normalized = email.lowercase().trim()
        val user = users.findByEmailIgnoreCase(normalized)
            .orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный email или пароль") }
        if (!passwordEncoder.matches(password, user.passwordHash)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный email или пароль")
        }
        return buildAuthResponse(user.email, user.playerClientId)
    }

    fun me(playerClientId: UUID): UserMeDto {
        val user = users.findByPlayerClientId(playerClientId).orElse(null)
        return UserMeDto(
            playerId = playerClientId.toString(),
            email = user?.email,
            guest = user == null,
        )
    }

    private fun buildAuthResponse(email: String, playerClientId: UUID): AuthResponseDto {
        val token = jwtService.createToken(playerClientId)
        val expSec = (jwtProperties.expirationMs / 1000).toInt()
        return AuthResponseDto(
            accessToken = token,
            tokenType = "Bearer",
            expiresIn = expSec,
            playerId = playerClientId.toString(),
            email = email,
        )
    }
}
