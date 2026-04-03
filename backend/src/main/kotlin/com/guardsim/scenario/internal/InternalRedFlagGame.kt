package com.guardsim.scenario.internal

data class InternalRedFlagGame(
    val instruction: String,
    val candidates: List<InternalRedFlagCandidate>,
    /** Должно совпадать с числом [InternalRedFlagCandidate.isRedFlag] == true */
    val requiredPickCount: Int,
)
