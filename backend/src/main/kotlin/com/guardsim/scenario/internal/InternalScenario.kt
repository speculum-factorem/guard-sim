package com.guardsim.scenario.internal

import com.guardsim.scenario.ScenarioHubChannel
import com.guardsim.scenario.ScenarioType

data class InternalScenario(
    val id: String,
    val title: String,
    val type: ScenarioType,
    val description: String,
    /** Если null — выводится из [type]: EMAIL→MAIL, SOCIAL→SOCIAL */
    val hubChannel: ScenarioHubChannel? = null,
    val steps: List<InternalStep>,
)
