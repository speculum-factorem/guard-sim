package com.guardsim.api

import com.guardsim.auth.UserRepository
import com.guardsim.dto.PlayerStateDto
import com.guardsim.player.PlayerService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.security.SecurityRequirements
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Игрок", description = "Состояние прогресса и достижений")
@SecurityRequirements(
    SecurityRequirement(name = "bearerJwt"),
    SecurityRequirement(name = "playerId"),
)
@RestController
@RequestMapping("/api/player")
class PlayerController(
    private val playerService: PlayerService,
    private val users: UserRepository,
) {

    @Operation(summary = "Состояние игрока", description = "Репутация, XP, уровень, завершённые сценарии, награды, недельная цель.")
    @GetMapping("/state")
    fun state(request: HttpServletRequest): PlayerStateDto {
        request.requireRegisteredUserOrDemo(users)
        val id = request.requirePlayerId()
        val player = playerService.getOrCreate(id)
        return playerService.toStateDto(player)
    }
}
