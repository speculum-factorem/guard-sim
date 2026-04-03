package com.guardsim.scenario.internal

import com.guardsim.career.CareerRole
import com.guardsim.scenario.ScenarioType

data class InternalScenario(
    val id: String,
    val title: String,
    val type: ScenarioType,
    val description: String,
    val steps: List<InternalStep>,
    /** Минимальная роль, чтобы сценарий был доступен. */
    val requiredRole: CareerRole = CareerRole.INTERN,
)
