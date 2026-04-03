package com.guardsim.scenario.internal

data class InternalStep(
    val id: String,
    val narrative: String,
    val choices: List<InternalChoice>,
    val uiKind: StepUiKind = StepUiKind.GENERIC,
    val emailSubject: String? = null,
    val emailFrom: String? = null,
    val investigationPanels: List<InternalInvestigationPanel> = emptyList(),
    /** Минимум открытых вкладок расследования для бонуса к репутации при верном ответе; 0 — не требуется */
    val investigationBonusThreshold: Int = 0,
    val hotspots: List<InternalHotspot> = emptyList(),
    val urlCompareGame: InternalUrlCompareGame? = null,
    /** Лишний текст (подпись, юр. мелкий шрифт) — имитация «шума» в письме */
    val narrativeNoise: String? = null,
    /** Секунды на шаг: клиент показывает таймер; без санкций при нуле (см. интерфейс) */
    val pressureSeconds: Int? = null,
    val redFlagGame: InternalRedFlagGame? = null,
    /** Текст «ситуации» для игрока (мета-описание); контент интерфейса — в [narrative] */
    val situationBrief: String? = null,
)
