package com.guardsim.scenario.internal

import com.guardsim.scenario.ScenarioHubChannel
import com.guardsim.scenario.ScenarioType

data class AttackTechnique(
    /** Идентификатор техники MITRE ATT&CK, напр. «T1566.001» */
    val techniqueId: String,
    /** Название техники, напр. «Spearphishing Link» */
    val techniqueName: String,
    /** Тактика ATT&CK, напр. «Initial Access» */
    val tactic: String,
    /** Как именно эта техника применялась в данном сценарии (RU) */
    val description: String,
)

data class AttackBreakdown(
    /** Краткое резюме всей цепочки атаки (RU) */
    val summary: String,
    val techniques: List<AttackTechnique>,
    /** Практическая рекомендация по защите (RU) */
    val howToDefend: String,
)

data class InternalScenario(
    val id: String,
    val title: String,
    val type: ScenarioType,
    val description: String,
    /** Краткая метка типа атаки для каталога (RU), напр. «Фишинг», «Вишинг». */
    val attackTypeLabel: String,
    /** Если null — выводится из [type]: EMAIL→MAIL, SOCIAL→SOCIAL */
    val hubChannel: ScenarioHubChannel? = null,
    val steps: List<InternalStep>,
    /** false — сценарий скрыт из каталога (не удалён). */
    val visible: Boolean = true,
    /** База знаний: разбор атаки с MITRE ATT&CK маппингом. null — раздел не показывается. */
    val attackBreakdown: AttackBreakdown? = null,
)
