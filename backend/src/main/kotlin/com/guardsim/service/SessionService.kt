package com.guardsim.service

import com.guardsim.dto.AnswerRequest
import com.guardsim.dto.AnswerResponse
import com.guardsim.dto.CareerSnapshotDto
import com.guardsim.dto.StartSessionResponse
import com.guardsim.dto.StepPublicDto
import com.guardsim.player.PlayerService
import com.guardsim.session.GameSessionEntity
import com.guardsim.session.GameSessionRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class SessionService(
    private val sessions: GameSessionRepository,
    private val scenarios: ScenarioService,
    private val playerService: PlayerService,
) {

    @Transactional
    fun startSession(scenarioId: String, playerClientId: UUID): StartSessionResponse {
        val player = playerService.getOrCreate(playerClientId)
        val scenario = scenarios.findInternal(scenarioId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Сценарий не найден")
        if (scenario.steps.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Сценарий без шагов")
        }
        if (!playerService.canAccess(player, scenario)) {
            throw ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Сценарий пока заблокирован. Повысьте роль: пройдите доступные миссии.",
            )
        }
        val sessionId = UUID.randomUUID()
        val entity = GameSessionEntity(
            id = sessionId,
            scenarioId = scenarioId,
            currentStepIndex = 0,
            score = 0,
            completed = false,
            playerClientId = playerClientId,
            hadIncorrectStep = false,
        )
        sessions.save(entity)
        val first = scenario.steps.first()
        return StartSessionResponse(
            sessionId = sessionId.toString(),
            scenarioId = scenario.id,
            scenarioTitle = scenario.title,
            currentStep = scenarios.toPublicStep(first),
            stepIndex = 0,
            totalSteps = scenario.steps.size,
        )
    }

    @Transactional
    fun submitAnswer(sessionId: UUID, stepId: String, body: AnswerRequest): AnswerResponse {
        val entity = sessions.findById(sessionId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Сессия не найдена") }
        if (entity.completed) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Сессия уже завершена")
        }
        val playerClient = entity.playerClientId
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Сессия без профиля игрока")
        val player = playerService.getOrCreate(playerClient)

        val scenario = scenarios.findInternal(entity.scenarioId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Сценарий не найден")
        val idx = entity.currentStepIndex
        if (idx !in scenario.steps.indices) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Некорректное состояние сессии")
        }
        val current = scenario.steps[idx]
        if (current.id != stepId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Шаг не совпадает с текущим")
        }
        current.redFlagGame?.let { game ->
            val mustPick = game.candidates.filter { it.isRedFlag }.map { it.id }.toSet()
            if (mustPick.size != game.requiredPickCount) {
                throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Некорректная конфигурация шага")
            }
            val selected = body.redFlagSelectionIds.toSet()
            if (selected != mustPick) {
                throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Сначала отметьте ровно ${game.requiredPickCount} подозрительных признака: выберите фрагменты, которые реально должны насторожить.",
                )
            }
        }
        val chosen = scenarios.findChoice(scenario, stepId, body.choiceId)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Вариант ответа не найден")
        val correct = chosen.correct
        val critical = !correct && chosen.criticalIfWrong
        val repDelta = playerService.applyAnswerReputation(player, correct, critical)

        var investigationDelta = 0
        if (correct && current.investigationBonusThreshold > 0 && current.investigationPanels.isNotEmpty()) {
            val validIds = current.investigationPanels.map { it.id }.toSet()
            val viewed = body.investigationViewedIds.filter { it in validIds }.distinct()
            investigationDelta = if (viewed.size >= current.investigationBonusThreshold) {
                playerService.applyReputationDelta(player, 2)
            } else {
                playerService.applyReputationDelta(player, -1)
            }
        }

        val newScore = entity.score + if (correct) chosen.scoreDelta else 0
        entity.score = maxOf(0, newScore)
        entity.hadIncorrectStep = entity.hadIncorrectStep || !correct
        val nextIndex = idx + 1
        entity.currentStepIndex = nextIndex
        val completed = nextIndex >= scenario.steps.size
        val nextStep: StepPublicDto? = if (completed) null else scenarios.toPublicStep(scenario.steps[nextIndex])
        if (completed) {
            entity.completed = true
        }
        sessions.save(entity)

        val roleBeforePromotions = player.role
        val totalRepDelta = repDelta + investigationDelta
        val career = if (completed) {
            val snap = playerService.onScenarioFinished(
                player,
                entity.scenarioId,
                entity.hadIncorrectStep,
                roleBeforePromotions,
            )
            snap.copy(reputationDelta = totalRepDelta, reputation = player.reputation)
        } else {
            CareerSnapshotDto(
                reputation = player.reputation,
                reputationDelta = totalRepDelta,
                role = player.role,
                roleChanged = false,
                perfectScenarioStreak = player.perfectScenarioStreak,
                newAchievements = emptyList(),
            )
        }

        val consequenceBeat =
            if (!correct && chosen.criticalIfWrong) chosen.consequenceBeat else null

        return AnswerResponse(
            correct = correct,
            explanation = chosen.explanationWhenChosen,
            totalScore = entity.score,
            completed = completed,
            nextStep = nextStep,
            stepIndex = if (completed) scenario.steps.size else nextIndex,
            totalSteps = scenario.steps.size,
            career = career,
            consequenceBeat = consequenceBeat,
            investigationReputationDelta = investigationDelta,
        )
    }

    fun findSession(id: UUID): GameSessionEntity? = sessions.findById(id).orElse(null)
}
