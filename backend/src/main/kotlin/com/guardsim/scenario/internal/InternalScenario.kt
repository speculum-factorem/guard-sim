package com.guardsim.scenario.internal

import com.guardsim.scenario.ScenarioType

data class InternalScenario(
    val id: String,
    val title: String,
    val type: ScenarioType,
    val description: String,
    val steps: List<InternalStep>,
)
