package com.guardsim.api

object ApiMessages {
    fun playerIdOrAuthRequired(): String =
        "Нужен вход (Authorization: Bearer …) или заголовок ${GuardSimHeaders.PLAYER_ID} с UUID игрока"
}
