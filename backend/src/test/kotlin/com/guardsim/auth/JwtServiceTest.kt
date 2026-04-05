package com.guardsim.auth

import com.guardsim.config.JwtProperties
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import java.util.UUID

class JwtServiceTest {
    private val props =
        JwtProperties(
            secret = "guardsim-dev-jwt-secret-change-in-production-32b!",
            expirationMs = 60_000L,
        )

    @Test
    fun `createToken and parsePlayerId roundtrip`() {
        val svc = JwtService(props)
        val id = UUID.randomUUID()
        val token = svc.createToken(id)
        assertEquals(id, svc.parsePlayerId(token))
    }

    @Test
    fun `parsePlayerId returns null for garbage`() {
        val svc = JwtService(props)
        assertNull(svc.parsePlayerId("not-a-jwt"))
    }
}
