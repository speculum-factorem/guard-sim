package com.guardsim.api

import com.guardsim.dto.ScenarioDetailDto
import com.guardsim.dto.ScenarioSummaryDto
import com.guardsim.dto.StartSessionResponse
import com.guardsim.auth.UserRepository
import com.guardsim.service.ScenarioService
import com.guardsim.service.SessionService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.security.SecurityRequirements
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

@Tag(
    name = "Сценарии",
    description = "Каталог сценариев и запуск сессии. Без регистрации добавьте авторизацию demoMode (X-GuardSim-Demo: 1).",
)
@SecurityRequirements(
    SecurityRequirement(name = "bearerJwt"),
    SecurityRequirement(name = "playerId"),
)
@RestController
@RequestMapping("/api/scenarios")
class ScenarioController(
    private val scenarioService: ScenarioService,
    private val sessionService: SessionService,
    private val users: UserRepository,
) {

    @Operation(summary = "Список сценариев")
    @GetMapping
    fun list(request: HttpServletRequest): List<ScenarioSummaryDto> {
        request.requireRegisteredUserOrDemo(users)
        return scenarioService.listSummaries()
    }

    @Operation(summary = "Детали сценария", description = "Шаги и метаданные для прохождения.")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: String, request: HttpServletRequest): ScenarioDetailDto {
        request.requireRegisteredUserOrDemo(users)
        return scenarioService.findPublicDetail(id)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Сценарий не найден")
    }

    @Operation(summary = "Старт или возобновление сессии", description = "Создаёт сессию или подхватывает незавершённую.")
    @PostMapping("/{id}/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    fun startSession(
        @PathVariable id: String,
        @Parameter(description = "Начать сценарий с первого шага")
        @RequestParam(name = "restart", required = false) restart: Boolean?,
        request: HttpServletRequest,
    ): StartSessionResponse {
        request.requireRegisteredUserOrDemo(users)
        val clientId = request.requirePlayerId()
        return sessionService.startSession(id, clientId, restart == true)
    }
}
