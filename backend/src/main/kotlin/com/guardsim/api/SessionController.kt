package com.guardsim.api

import com.guardsim.auth.UserRepository
import com.guardsim.dto.AnswerRequest
import com.guardsim.dto.AnswerResponse
import com.guardsim.service.SessionService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.security.SecurityRequirements
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@Tag(name = "Сессии", description = "Ответы на шаги активной сессии")
@SecurityRequirements(
    SecurityRequirement(name = "bearerJwt"),
    SecurityRequirement(name = "playerId"),
)
@RestController
@RequestMapping("/api/sessions")
class SessionController(
    private val sessionService: SessionService,
    private val users: UserRepository,
) {

    @Operation(
        summary = "Ответ на шаг",
        description = "Проверка выбора, мини-игр (red flag, расследование и т.д.). При pressureExpired сервер засчитывает таймаут.",
    )
    @PostMapping("/{sessionId}/steps/{stepId}/answer")
    fun answer(
        @PathVariable sessionId: String,
        @PathVariable stepId: String,
        @Valid @RequestBody body: AnswerRequest,
        request: HttpServletRequest,
    ): AnswerResponse {
        request.requireRegisteredUserOrDemo(users)
        val caller = request.requirePlayerId()
        val uuid = try {
            UUID.fromString(sessionId)
        } catch (_: IllegalArgumentException) {
            throw IllegalArgumentException("Некорректный идентификатор сессии")
        }
        return sessionService.submitAnswer(uuid, stepId, body, caller)
    }
}
