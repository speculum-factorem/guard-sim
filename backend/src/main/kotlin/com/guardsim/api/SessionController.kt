package com.guardsim.api

import com.guardsim.dto.AnswerRequest
import com.guardsim.dto.AnswerResponse
import com.guardsim.service.SessionService
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/sessions")
class SessionController(
    private val sessionService: SessionService,
) {

    @PostMapping("/{sessionId}/steps/{stepId}/answer")
    fun answer(
        @PathVariable sessionId: String,
        @PathVariable stepId: String,
        @Valid @RequestBody body: AnswerRequest,
    ): AnswerResponse {
        val uuid = try {
            UUID.fromString(sessionId)
        } catch (_: IllegalArgumentException) {
            throw IllegalArgumentException("Некорректный идентификатор сессии")
        }
        return sessionService.submitAnswer(uuid, stepId, body)
    }
}
