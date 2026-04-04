package com.guardsim.dto

import com.guardsim.scenario.ScenarioType
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

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

data class SerpResultDto(
    val title: String,
    val displayUrl: String,
    val snippet: String,
    val choiceId: String,
)

data class SerpPickGameDto(
    val query: String,
    val results: List<SerpResultDto>,
)

data class NetShieldRowDto(
    val id: String,
    val remoteIp: String,
    val remoteHost: String,
    val rateLabel: String,
    val note: String?,
    val choiceId: String,
)

data class NetShieldGameDto(
    val consoleTitle: String,
    val rows: List<NetShieldRowDto>,
)

data class VirusTotalGameDto(
    val scannedUrl: String,
    val enginesFlagged: Int,
    val enginesTotal: Int,
    val permalinkStub: String,
    val verdictHeadline: String,
)

data class PhoneSmsLineDto(
    val sender: String,
    val text: String,
    val time: String,
)

data class PhoneCallOverlayDto(
    val callerLabel: String,
    val callerSubtitle: String,
    val numberDisplay: String,
)

data class PhoneIncidentGameDto(
    val statusBarTime: String,
    val networkLabel: String,
    val screenTitle: String,
    val smsLines: List<PhoneSmsLineDto>,
    val callOverlay: PhoneCallOverlayDto,
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
    val serpPickGame: SerpPickGameDto?,
    val netShieldGame: NetShieldGameDto?,
    val virusTotalGame: VirusTotalGameDto?,
    val phoneIncidentGame: PhoneIncidentGameDto?,
    val narrativeNoise: String?,
    val pressureSeconds: Int?,
    val redFlagGame: RedFlagGameDto?,
    val situationBrief: String?,
    val simChatTitle: String?,
    val simChatForwardFrom: String?,
    val simChatSenderLabel: String?,
    val simCalendarWhen: String?,
    val simCalendarWhere: String?,
    val simExtensionName: String?,
    val simExtensionPublisher: String?,
    val simExtensionBlurb: String?,
)

data class ScenarioSummaryDto(
    val id: String,
    val title: String,
    val type: ScenarioType,
    val description: String,
    /** MAIL | SOCIAL | SECURITY */
    val hubChannel: String,
    /** Тип кибератаки (короткая подпись на русском) */
    val attackTypeLabel: String,
)

data class ScenarioDetailDto(
    val id: String,
    val title: String,
    val type: ScenarioType,
    val description: String,
    val hubChannel: String,
    val attackTypeLabel: String,
    val steps: List<StepPublicDto>,
)

data class StartSessionResponse(
    val sessionId: String,
    val scenarioId: String,
    val scenarioTitle: String,
    val currentStep: StepPublicDto,
    val stepIndex: Int,
    val totalSteps: Int,
    val resumed: Boolean = false,
    /** Баллы в сессии (при возобновлении — сохранённые) */
    val totalScore: Int = 0,
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
    val experience: Int,
    val experienceDelta: Int,
    val level: Int,
    val levelChanged: Boolean,
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
    val experience: Int,
    val level: Int,
    val perfectScenarioStreak: Int,
    val completedScenarioIds: List<String>,
    val achievements: List<PlayerAchievementStateDto>,
    val weeklyGoalCurrent: Int,
    val weeklyGoalTarget: Int,
    /** Понедельник учётной недели (YYYY-MM-DD) или null */
    val weeklyGoalWeekStart: String?,
)

data class RegisterRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank @field:Size(min = 8, max = 128) val password: String,
)

data class LoginRequest(
    @field:NotBlank @field:Email val email: String,
    @field:NotBlank val password: String,
)

data class AuthResponseDto(
    val accessToken: String,
    val tokenType: String,
    val expiresIn: Int,
    val playerId: String,
    val email: String,
)

data class UserMeDto(
    val playerId: String,
    val email: String?,
    val guest: Boolean,
)
