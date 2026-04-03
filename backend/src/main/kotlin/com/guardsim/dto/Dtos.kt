package com.guardsim.dto

import com.guardsim.career.CareerRole
import com.guardsim.scenario.ScenarioType
import jakarta.validation.constraints.NotBlank

data class ErrorResponse(val error: String)

data class ChoicePublicDto(val id: String, val label: String)

data class InvestigationPanelDto(
    val id: String,
    val title: String,
    val body: String,
)

data class HotspotDto(
    val id: String,
    val label: String,
    val choiceId: String,
    val variant: String,
)

data class UrlCompareGameDto(
    val leftUrl: String,
    val rightUrl: String,
    val leftChoiceId: String,
    val rightChoiceId: String,
    val caption: String,
)

/** Без поля «правильный» — клиент не знает, какие из фрагментов опасны. */
data class RedFlagCandidatePublicDto(
    val id: String,
    val label: String,
)

data class RedFlagGameDto(
    val instruction: String,
    val candidates: List<RedFlagCandidatePublicDto>,
    val requiredPickCount: Int,
)

data class StepPublicDto(
    val id: String,
    val narrative: String,
    val choices: List<ChoicePublicDto>,
    val uiKind: String,
    val emailSubject: String?,
    val emailFrom: String?,
    val investigationPanels: List<InvestigationPanelDto>,
    val investigationBonusThreshold: Int,
    val hotspots: List<HotspotDto>,
    val urlCompareGame: UrlCompareGameDto?,
    val narrativeNoise: String?,
    val pressureSeconds: Int?,
    val redFlagGame: RedFlagGameDto?,
    val situationBrief: String?,
)

data class ScenarioSummaryDto(
    val id: String,
    val title: String,
    val type: ScenarioType,
    val description: String,
    val locked: Boolean,
    val requiredRole: CareerRole,
)

data class ScenarioDetailDto(
    val id: String,
    val title: String,
    val type: ScenarioType,
    val description: String,
    val steps: List<StepPublicDto>,
)

data class StartSessionResponse(
    val sessionId: String,
    val scenarioId: String,
    val scenarioTitle: String,
    val currentStep: StepPublicDto,
    val stepIndex: Int,
    val totalSteps: Int,
)

data class AnswerRequest(
    @field:NotBlank(message = "choiceId обязателен") val choiceId: String,
    val investigationViewedIds: List<String> = emptyList(),
    val redFlagSelectionIds: List<String> = emptyList(),
)

data class AchievementDto(
    val id: String,
    val title: String,
    val description: String,
)

data class CareerSnapshotDto(
    val reputation: Int,
    val reputationDelta: Int,
    val role: CareerRole,
    val roleChanged: Boolean,
    val perfectScenarioStreak: Int,
    val newAchievements: List<AchievementDto>,
)

data class AnswerResponse(
    val correct: Boolean,
    val explanation: String,
    val totalScore: Int,
    val completed: Boolean,
    val nextStep: StepPublicDto?,
    val stepIndex: Int,
    val totalSteps: Int,
    val career: CareerSnapshotDto,
    val consequenceBeat: String?,
    val investigationReputationDelta: Int,
)

data class PlayerAchievementStateDto(
    val id: String,
    val title: String,
    val description: String,
    val unlocked: Boolean,
)

data class PlayerStateDto(
    val clientId: String,
    val reputation: Int,
    val role: CareerRole,
    val perfectScenarioStreak: Int,
    val completedScenarioIds: List<String>,
    val achievements: List<PlayerAchievementStateDto>,
)
