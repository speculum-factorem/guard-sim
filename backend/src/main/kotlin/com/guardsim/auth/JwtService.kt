package com.guardsim.auth

import com.guardsim.config.JwtProperties
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.util.Date
import java.util.UUID
import javax.crypto.SecretKey

@Service
class JwtService(
    private val props: JwtProperties,
) {
    private val key: SecretKey by lazy {
        val raw = props.secret.toByteArray(StandardCharsets.UTF_8)
        require(raw.size >= 32) { "guardsim.jwt.secret must be at least 32 bytes (UTF-8)" }
        Keys.hmacShaKeyFor(raw)
    }

    fun createToken(playerClientId: UUID): String {
        val now = System.currentTimeMillis()
        return Jwts.builder()
            .subject(playerClientId.toString())
            .issuedAt(Date(now))
            .expiration(Date(now + props.expirationMs))
            .signWith(key)
            .compact()
    }

    fun parsePlayerId(token: String): UUID? =
        runCatching {
            val parsed = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
            UUID.fromString(parsed.payload.subject)
        }.getOrNull()
}
