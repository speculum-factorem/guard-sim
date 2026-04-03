package com.guardsim.api

import com.guardsim.dto.ScenarioDetailDto
import com.guardsim.dto.ScenarioSummaryDto
import com.guardsim.dto.StartSessionResponse
import com.guardsim.player.PlayerService
import com.guardsim.service.ScenarioService
import com.guardsim.service.SessionService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@RestController
@RequestMapping("/api/scenarios")
class ScenarioController(
    private val scenarioService: ScenarioService,
    private val sessionService: SessionService,
    private val playerService: PlayerService,
) {

    @GetMapping
    fun list(@RequestHeader(name = GuardSimHeaders.PLAYER_ID) rawClientId: String): List<ScenarioSummaryDto> {
        val id = UUID.fromString(rawClientId)
        val player = playerService.getOrCreate(id)
        return scenarioService.listSummariesForPlayer(player)
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: String): ScenarioDetailDto =
        scenarioService.findPublicDetail(id)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Сценарий не найден")

    @PostMapping("/{id}/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    fun startSession(
        @PathVariable id: String,
        @RequestHeader(name = GuardSimHeaders.PLAYER_ID) rawClientId: String,
    ): StartSessionResponse {
        val clientId = UUID.fromString(rawClientId)
        return sessionService.startSession(id, clientId)
    }
}
