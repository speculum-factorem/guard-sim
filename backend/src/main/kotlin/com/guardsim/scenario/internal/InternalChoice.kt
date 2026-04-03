package com.guardsim.scenario.internal

data class InternalChoice(
    val id: String,
    val label: String,
    val correct: Boolean,
    val explanationWhenChosen: String,
    val scoreDelta: Int,
    /** Для неверного ответа: опасное действие (клик по ссылке, ввод пароля и т.п.) — сильнее бьёт по репутации. */
    val criticalIfWrong: Boolean = false,
    /** Короткая вставка «что произошло» при критической ошибке (до разбора). */
    val consequenceBeat: String? = null,
)
