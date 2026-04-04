package com.guardsim.scenario.internal

data class InternalNetShieldRow(
    val id: String,
    val remoteIp: String,
    val remoteHost: String,
    val rateLabel: String,
    val note: String?,
    val choiceId: String,
)

data class InternalNetShieldGame(
    val consoleTitle: String,
    val rows: List<InternalNetShieldRow>,
)
