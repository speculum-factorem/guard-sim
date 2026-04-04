package com.guardsim.career

data class AchievementDefinition(
    val id: String,
    val title: String,
    val description: String,
)

object AchievementCatalog {
    val ALL: List<AchievementDefinition> = listOf(
        AchievementDefinition(
            id = "first-phishing-spotless",
            title = "Первый фишинг распознан",
            description = "Вы завершили сценарий про фишинг в почте без единой ошибки.",
        ),
        AchievementDefinition(
            id = "zero-leak-week",
            title = "Нулевая утечка за неделю",
            description = "Семь сценариев подряд завершены идеально (как семь дней без инцидентов).",
        ),
        AchievementDefinition(
            id = "ten-perfect-row",
            title = "Десять сценариев без критики",
            description = "10 сценариев подряд без ни одной ошибки на пути.",
        ),
        AchievementDefinition(
            id = "challenge-track-inbox",
            title = "Дорожка: Входящие под ударом",
            description = "Вы завершили все сценарии челлендж-дорожки про почту и поддельные запросы.",
        ),
        AchievementDefinition(
            id = "challenge-track-social",
            title = "Дорожка: Лента и сделки",
            description = "Вы завершили все сценарии дорожки про соцсети и сделки вне площадки.",
        ),
        AchievementDefinition(
            id = "challenge-track-soc",
            title = "Дорожка: ИБ — инциденты",
            description = "Вы завершили все сценарии дорожки для ответа на сложные инциденты.",
        ),
        AchievementDefinition(
            id = "challenge-track-consumer",
            title = "Дорожка: Учётки и деньги (быт)",
            description = "Вы завершили все сценарии дорожки про смсишинг, вишинг и схемы с учётными записями.",
        ),
        AchievementDefinition(
            id = "challenge-track-smokescreen",
            title = "Дорожка: Шум и vishing",
            description = "Вы прошли дорожку про SMS-бомбинг как фон и звонок «поддержки».",
        ),
        AchievementDefinition(
            id = "challenge-track-malware-endpoints",
            title = "Дорожка: Вредоносы и эндпоинты",
            description = "Вы завершили все сценарии дорожки про VPN/VirusTotal, винлокер и RAT.",
        ),
        AchievementDefinition(
            id = "challenge-track-search-perimeter",
            title = "Дорожка: Поиск и периметр",
            description = "Вы завершили дорожку про выбор сайта в поиске и защиту периметра от DDoS.",
        ),
        AchievementDefinition(
            id = "challenge-track-benign",
            title = "Дорожка: Когда угрозы нет",
            description = "Вы завершили все сценарии дорожки про штатные уведомления без ложной тревоги.",
        ),
        AchievementDefinition(
            id = "trust-80",
            title = "Высокое доверие",
            description = "Показатель доверия клиентов достиг 80% и выше.",
        ),
        AchievementDefinition(
            id = "trust-95",
            title = "Эталон надёжности",
            description = "Показатель доверия клиентов достиг 95% и выше.",
        ),
    )

    private val byId: Map<String, AchievementDefinition> = ALL.associateBy { it.id }

    fun find(id: String): AchievementDefinition? = byId[id]
}
