package com.guardsim.api

import com.guardsim.dto.PlayerStateDto
import com.guardsim.player.PlayerService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/player")
class PlayerController(
    private val playerService: PlayerService,
) {

    @GetMapping("/state")
    fun state(@RequestHeader(name = GuardSimHeaders.PLAYER_ID) rawClientId: String): PlayerStateDto {
        val id = UUID.fromString(rawClientId)
        val player = playerService.getOrCreate(id)
        return playerService.toStateDto(player)
    }
}
