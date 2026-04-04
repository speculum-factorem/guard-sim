package com.guardsim.api

import com.guardsim.auth.UserRepository
import com.guardsim.dto.PlayerStateDto
import com.guardsim.player.PlayerService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/player")
class PlayerController(
    private val playerService: PlayerService,
    private val users: UserRepository,
) {

    @GetMapping("/state")
    fun state(request: HttpServletRequest): PlayerStateDto {
        request.requireRegisteredUserOrDemo(users)
        val id = request.requirePlayerId()
        val player = playerService.getOrCreate(id)
        return playerService.toStateDto(player)
    }
}
