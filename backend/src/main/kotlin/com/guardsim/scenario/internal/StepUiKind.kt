package com.guardsim.scenario.internal

enum class StepUiKind {
    /** Обычный текст + кнопки ответов */
    GENERIC,

    /** Рамка почтового клиента + опционально хотспоты */
    EMAIL_CLIENT,

    /** Карточка уведомления соцсети */
    SOCIAL_NOTIFICATION,

    /** Тикет / задание ИБ */
    DESK_TICKET,

    /** Мини-игра: два URL на выбор (привязка к идентификатору варианта ответа) */
    MINI_URL_COMPARE,
}
