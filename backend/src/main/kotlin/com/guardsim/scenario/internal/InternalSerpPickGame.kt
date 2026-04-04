package com.guardsim.scenario.internal

data class InternalSerpResult(
    val title: String,
    val displayUrl: String,
    val snippet: String,
    val choiceId: String,
)

data class InternalSerpPickGame(
    val query: String,
    val results: List<InternalSerpResult>,
)
