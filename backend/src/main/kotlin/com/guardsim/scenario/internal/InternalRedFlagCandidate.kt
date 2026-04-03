package com.guardsim.scenario.internal

/** Один кликабельный фрагмент: часть — настоящие «красные флаги», часть — отвлекающие. */
data class InternalRedFlagCandidate(
    val id: String,
    val label: String,
    val isRedFlag: Boolean,
)
