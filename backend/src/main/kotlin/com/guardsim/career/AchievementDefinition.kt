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
    )

    private val byId: Map<String, AchievementDefinition> = ALL.associateBy { it.id }

    fun find(id: String): AchievementDefinition? = byId[id]
}
