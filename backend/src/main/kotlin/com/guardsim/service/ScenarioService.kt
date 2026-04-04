package com.guardsim.service

import com.guardsim.dto.ChoicePublicDto
import com.guardsim.dto.HotspotDto
import com.guardsim.dto.InvestigationPanelDto
import com.guardsim.dto.ScenarioDetailDto
import com.guardsim.dto.ScenarioSummaryDto
import com.guardsim.dto.StepPublicDto
import com.guardsim.dto.RedFlagCandidatePublicDto
import com.guardsim.dto.RedFlagGameDto
import com.guardsim.dto.NetShieldGameDto
import com.guardsim.dto.NetShieldRowDto
import com.guardsim.dto.SerpPickGameDto
import com.guardsim.dto.SerpResultDto
import com.guardsim.dto.UrlCompareGameDto
import com.guardsim.dto.PhoneCallOverlayDto
import com.guardsim.dto.PhoneIncidentGameDto
import com.guardsim.dto.PhoneSmsLineDto
import com.guardsim.dto.VirusTotalGameDto
import com.guardsim.scenario.ScenarioHubChannel
import com.guardsim.scenario.ScenarioRegistry
import com.guardsim.scenario.ScenarioType
import com.guardsim.scenario.internal.InternalChoice
import com.guardsim.scenario.internal.InternalScenario
import com.guardsim.scenario.internal.InternalStep
import com.guardsim.scenario.internal.InternalRedFlagGame
import com.guardsim.scenario.internal.InternalNetShieldGame
import com.guardsim.scenario.internal.InternalSerpPickGame
import com.guardsim.scenario.internal.InternalUrlCompareGame
import com.guardsim.scenario.internal.InternalPhoneIncidentGame
import com.guardsim.scenario.internal.InternalVirusTotalGame
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
        val serpGame = step.serpPickGame?.let { toSerpPickDto(it) }
        val netGame = step.netShieldGame?.let { toNetShieldDto(it) }
        val vtGame = step.virusTotalGame?.let { toVirusTotalDto(it) }
        val phoneGame = step.phoneIncidentGame?.let { toPhoneIncidentDto(it) }
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
            serpPickGame = serpGame,
            netShieldGame = netGame,
            virusTotalGame = vtGame,
            phoneIncidentGame = phoneGame,
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

    private fun toSerpPickDto(g: InternalSerpPickGame): SerpPickGameDto =
        SerpPickGameDto(
            query = g.query,
            results = g.results.map { r ->
                SerpResultDto(
                    title = r.title,
                    displayUrl = r.displayUrl,
                    snippet = r.snippet,
                    choiceId = r.choiceId,
                )
            },
        )

    private fun toNetShieldDto(g: InternalNetShieldGame): NetShieldGameDto =
        NetShieldGameDto(
            consoleTitle = g.consoleTitle,
            rows = g.rows.map { row ->
                NetShieldRowDto(
                    id = row.id,
                    remoteIp = row.remoteIp,
                    remoteHost = row.remoteHost,
                    rateLabel = row.rateLabel,
                    note = row.note,
                    choiceId = row.choiceId,
                )
            },
        )

    private fun toVirusTotalDto(g: InternalVirusTotalGame): VirusTotalGameDto =
        VirusTotalGameDto(
            scannedUrl = g.scannedUrl,
            enginesFlagged = g.enginesFlagged,
            enginesTotal = g.enginesTotal,
            permalinkStub = g.permalinkStub,
            verdictHeadline = g.verdictHeadline,
        )

    private fun toPhoneIncidentDto(g: InternalPhoneIncidentGame): PhoneIncidentGameDto =
        PhoneIncidentGameDto(
            statusBarTime = g.statusBarTime,
            networkLabel = g.networkLabel,
            screenTitle = g.screenTitle,
            smsLines = g.smsLines.map { s ->
                PhoneSmsLineDto(sender = s.sender, text = s.text, time = s.time)
            },
            callOverlay = PhoneCallOverlayDto(
                callerLabel = g.callOverlay.callerLabel,
                callerSubtitle = g.callOverlay.callerSubtitle,
                numberDisplay = g.callOverlay.numberDisplay,
            ),
        )

    fun findChoice(scenario: InternalScenario, stepId: String, choiceId: String): InternalChoice? {
        val step = scenario.steps.firstOrNull { it.id == stepId } ?: return null
        return step.choices.firstOrNull { it.id == choiceId }
    }
}
