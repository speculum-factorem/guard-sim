package com.guardsim.api

import com.guardsim.dto.ScenarioDetailDto
import com.guardsim.dto.ScenarioSummaryDto
import com.guardsim.dto.StartSessionResponse
import com.guardsim.auth.UserRepository
import com.guardsim.service.ScenarioService
import com.guardsim.service.SessionService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/scenarios")
class ScenarioController(
    private val scenarioService: ScenarioService,
    private val sessionService: SessionService,
    private val users: UserRepository,
) {

    @GetMapping
    fun list(request: HttpServletRequest): List<ScenarioSummaryDto> {
        request.requireRegisteredUserOrDemo(users)
        return scenarioService.listSummaries()
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: String, request: HttpServletRequest): ScenarioDetailDto {
        request.requireRegisteredUserOrDemo(users)
        return scenarioService.findPublicDetail(id)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Сценарий не найден")
    }

    @PostMapping("/{id}/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    fun startSession(
        @PathVariable id: String,
        request: HttpServletRequest,
    ): StartSessionResponse {
        request.requireRegisteredUserOrDemo(users)
        val clientId = request.requirePlayerId()
        return sessionService.startSession(id, clientId)
    }
}
