package com.guardsim.service

import com.guardsim.dto.ChoicePublicDto
import com.guardsim.dto.HotspotDto
import com.guardsim.dto.InvestigationPanelDto
import com.guardsim.dto.ScenarioDetailDto
import com.guardsim.dto.ScenarioSummaryDto
import com.guardsim.dto.StepPublicDto
import com.guardsim.dto.RedFlagCandidatePublicDto
import com.guardsim.dto.RedFlagGameDto
import com.guardsim.dto.UrlCompareGameDto
import com.guardsim.scenario.ScenarioHubChannel
import com.guardsim.scenario.ScenarioRegistry
import com.guardsim.scenario.ScenarioType
import com.guardsim.scenario.internal.InternalChoice
import com.guardsim.scenario.internal.InternalScenario
import com.guardsim.scenario.internal.InternalStep
import com.guardsim.scenario.internal.InternalRedFlagGame
import com.guardsim.scenario.internal.InternalUrlCompareGame
import org.springframework.stereotype.Service

@Service
class ScenarioService(
    private val registry: ScenarioRegistry,
) {

    fun listSummaries(): List<ScenarioSummaryDto> =
        registry.all().filter { it.visible }.sortedBy { it.id }.map { s ->
            ScenarioSummaryDto(
                id = s.id,
                title = s.title,
                type = s.type,
                description = s.description,
                hubChannel = effectiveHubChannel(s).name,
                attackTypeLabel = s.attackTypeLabel,
            )
        }

    fun findPublicDetail(id: String): ScenarioDetailDto? =
        registry.findById(id)?.let(::toDetailDto)

    fun findInternal(id: String): InternalScenario? = registry.findById(id)

    private fun toDetailDto(s: InternalScenario): ScenarioDetailDto =
        ScenarioDetailDto(
            id = s.id,
            title = s.title,
            type = s.type,
            description = s.description,
            hubChannel = effectiveHubChannel(s).name,
            attackTypeLabel = s.attackTypeLabel,
            steps = s.steps.map(::toPublicStep),
        )

    fun effectiveHubChannel(s: InternalScenario): ScenarioHubChannel =
        s.hubChannel ?: when (s.type) {
            ScenarioType.EMAIL -> ScenarioHubChannel.MAIL
            ScenarioType.SOCIAL -> ScenarioHubChannel.SOCIAL
        }

    fun toPublicStep(step: InternalStep): StepPublicDto {
        val choices = step.choices.map { ChoicePublicDto(it.id, it.label) }
        val panels = step.investigationPanels.map { InvestigationPanelDto(it.id, it.title, it.body) }
        val hotspots = step.hotspots.map { HotspotDto(it.id, it.label, it.choiceId, it.variant) }
        val urlGame = step.urlCompareGame?.let { g -> toUrlCompareDto(g) }
        val redGame = step.redFlagGame?.let { toRedFlagDto(it) }
        return StepPublicDto(
            id = step.id,
            narrative = step.narrative,
            choices = choices,
            uiKind = step.uiKind.name,
            emailSubject = step.emailSubject,
            emailFrom = step.emailFrom,
            investigationPanels = panels,
            investigationBonusThreshold = step.investigationBonusThreshold,
            hotspots = hotspots,
            urlCompareGame = urlGame,
            narrativeNoise = step.narrativeNoise,
            pressureSeconds = step.pressureSeconds,
            redFlagGame = redGame,
            situationBrief = step.situationBrief,
            simChatTitle = step.simChatTitle,
            simChatForwardFrom = step.simChatForwardFrom,
            simChatSenderLabel = step.simChatSenderLabel,
            simCalendarWhen = step.simCalendarWhen,
            simCalendarWhere = step.simCalendarWhere,
            simExtensionName = step.simExtensionName,
            simExtensionPublisher = step.simExtensionPublisher,
            simExtensionBlurb = step.simExtensionBlurb,
        )
    }

    private fun toRedFlagDto(g: InternalRedFlagGame): RedFlagGameDto =
        RedFlagGameDto(
            instruction = g.instruction,
            candidates = g.candidates.map { RedFlagCandidatePublicDto(id = it.id, label = it.label) },
            requiredPickCount = g.requiredPickCount,
        )

    private fun toUrlCompareDto(g: InternalUrlCompareGame): UrlCompareGameDto =
        UrlCompareGameDto(
            leftUrl = g.leftUrl,
            rightUrl = g.rightUrl,
            leftChoiceId = g.leftChoiceId,
            rightChoiceId = g.rightChoiceId,
            caption = g.caption,
        )

    fun findChoice(scenario: InternalScenario, stepId: String, choiceId: String): InternalChoice? {
        val step = scenario.steps.firstOrNull { it.id == stepId } ?: return null
        return step.choices.firstOrNull { it.id == choiceId }
    }
}
