package com.guardsim.api

object GuardSimHeaders {
    const val PLAYER_ID = "X-GuardSim-Player"
    /** Фронт выставляет в режиме демо (кнопка на лендинге); иначе игровые эндпоинты только для зарегистрированных. */
    const val DEMO = "X-GuardSim-Demo"
}
