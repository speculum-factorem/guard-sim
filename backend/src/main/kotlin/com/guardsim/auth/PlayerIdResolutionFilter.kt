package com.guardsim.auth

import com.guardsim.api.GuardsimAttributes
import com.guardsim.api.GuardSimHeaders
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

/**
 * Выставляет GUARDSIM_PLAYER_ID из JWT (приоритет) или из [GuardSimHeaders.PLAYER_ID].
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class PlayerIdResolutionFilter(
    private val jwtService: JwtService,
) : OncePerRequestFilter() {

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val uri = request.requestURI
        if (uri == "/api/auth/register" && request.method == "POST") {
            return true
        }
        if (uri == "/api/auth/login" && request.method == "POST") {
            return true
        }
        return false
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val bearer = request.getHeader("Authorization")
            ?.removePrefix("Bearer ")
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
        val fromJwt = bearer?.let { jwtService.parsePlayerId(it) }
        val rawHeader = request.getHeader(GuardSimHeaders.PLAYER_ID)
        val fromHeader = rawHeader?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        val playerId = fromJwt ?: fromHeader
        if (playerId != null) {
            request.setAttribute(GuardsimAttributes.PLAYER_ID, playerId)
        }
        filterChain.doFilter(request, response)
    }
}
