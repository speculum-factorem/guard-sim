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
    )

    private val byId: Map<String, AchievementDefinition> = ALL.associateBy { it.id }

    fun find(id: String): AchievementDefinition? = byId[id]
}
