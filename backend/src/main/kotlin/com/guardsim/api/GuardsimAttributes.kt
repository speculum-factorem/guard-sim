package com.guardsim.api

import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

object GuardsimAttributes {
    const val PLAYER_ID: String = "GUARDSIM_PLAYER_ID"
}

fun HttpServletRequest.requirePlayerId(): UUID {
    val id = getAttribute(GuardsimAttributes.PLAYER_ID) as? UUID
    return id ?: throw ResponseStatusException(
        HttpStatus.UNAUTHORIZED,
        "Нужен вход (Authorization: Bearer …) или заголовок ${GuardSimHeaders.PLAYER_ID} с UUID игрока",
    )
}
