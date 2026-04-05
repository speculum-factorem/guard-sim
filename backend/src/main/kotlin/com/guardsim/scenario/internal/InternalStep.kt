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
    val serpPickGame: InternalSerpPickGame? = null,
    val netShieldGame: InternalNetShieldGame? = null,
    val virusTotalGame: InternalVirusTotalGame? = null,
    val phoneIncidentGame: InternalPhoneIncidentGame? = null,
    /** Лишний текст (подпись, юр. мелкий шрифт) — имитация «шума» в письме */
    val narrativeNoise: String? = null,
    /** Секунды на шаг: клиент показывает таймер; по нулю — шаг считается проваленным (см. pressureExpired в ответе) */
    val pressureSeconds: Int? = null,
    val redFlagGame: InternalRedFlagGame? = null,
    /** Текст «ситуации» для игрока (мета-описание); контент интерфейса — в [narrative] */
    val situationBrief: String? = null,
    /** [CHAT_MESSENGER] Заголовок чата в шапке окна */
    val simChatTitle: String? = null,
    /** [CHAT_MESSENGER] Подпись «Переслано из …» */
    val simChatForwardFrom: String? = null,
    /** [CHAT_MESSENGER] Подпись отправителя пересланного сообщения */
    val simChatSenderLabel: String? = null,
    /** [CALENDAR_INVITE] Когда встреча (строка для UI) */
    val simCalendarWhen: String? = null,
    /** [CALENDAR_INVITE] Где / платформа */
    val simCalendarWhere: String? = null,
    /** [EXTENSION_STORE] Название расширения */
    val simExtensionName: String? = null,
    /** [EXTENSION_STORE] Издатель */
    val simExtensionPublisher: String? = null,
    /** [EXTENSION_STORE] Краткое описание под названием */
    val simExtensionBlurb: String? = null,
)
