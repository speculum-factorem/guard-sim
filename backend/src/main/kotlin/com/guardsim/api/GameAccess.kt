package com.guardsim.api

import com.guardsim.auth.UserRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

/**
 * Игровые API: либо зарегистрированный пользователь (есть запись User по player id),
 * либо явный режим демо ([GuardSimHeaders.DEMO]).
 */
fun HttpServletRequest.requireRegisteredUserOrDemo(users: UserRepository) {
    val playerId = requirePlayerId()
    if (isDemoRequest()) {
        return
    }
    if (users.findByPlayerClientId(playerId).isPresent) {
        return
    }
    throw ResponseStatusException(
        HttpStatus.UNAUTHORIZED,
        "Нужна регистрация или режим демо.",
    )
}

private fun HttpServletRequest.isDemoRequest(): Boolean {
    val v = getHeader(GuardSimHeaders.DEMO)?.trim()?.lowercase() ?: return false
    return v == "1" || v == "true" || v == "yes"
}
