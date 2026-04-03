package com.guardsim.player

import com.guardsim.career.AchievementCatalog
import com.guardsim.career.AchievementDefinition
import com.guardsim.career.CareerRole
import com.guardsim.dto.AchievementDto
import com.guardsim.dto.CareerSnapshotDto
import com.guardsim.dto.PlayerAchievementStateDto
import com.guardsim.dto.PlayerStateDto
import com.guardsim.scenario.internal.InternalScenario
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class PlayerService(
    private val players: PlayerRepository,
    @Value("\${guardsim.scenarios.unlock-all:false}")
    private val unlockAllScenarios: Boolean,
) {

    @Transactional
    fun getOrCreate(clientId: UUID): PlayerEntity =
        players.findById(clientId).orElseGet {
            players.save(PlayerEntity(clientId = clientId))
        }

    fun canAccess(player: PlayerEntity, scenario: InternalScenario): Boolean =
        unlockAllScenarios || player.role.ordinal >= scenario.requiredRole.ordinal

    @Transactional
    fun applyAnswerReputation(player: PlayerEntity, correct: Boolean, criticalIfWrong: Boolean): Int {
        val delta = when {
            correct -> +2
            criticalIfWrong -> -10
            else -> -4
        }
        player.reputation = (player.reputation + delta).coerceIn(0, 100)
        players.save(player)
        return delta
    }

    @Transactional
    fun applyReputationDelta(player: PlayerEntity, delta: Int): Int {
        player.reputation = (player.reputation + delta).coerceIn(0, 100)
        players.save(player)
        return delta
    }

    @Transactional
    fun onScenarioFinished(
        player: PlayerEntity,
        scenarioId: String,
        hadIncorrectStep: Boolean,
        roleSnapshotBefore: CareerRole,
    ): CareerSnapshotDto {
        val completed = parseCsv(player.completedScenarioIdsCsv).toMutableSet()
        completed.add(scenarioId)
        player.completedScenarioIdsCsv = joinCsv(completed)

        if (!hadIncorrectStep) {
            player.perfectScenarioStreak += 1
        } else {
            player.perfectScenarioStreak = 0
        }

        val existing = parseCsv(player.achievementIdsCsv).toMutableSet()
        val newAchievements = mutableListOf<AchievementDefinition>()

        if (scenarioId == BASIC_PHISHING && !hadIncorrectStep) {
            unlockAchievement(existing, newAchievements, ACH_FIRST_PHISHING)
        }
        if (player.perfectScenarioStreak >= 7) {
            unlockAchievement(existing, newAchievements, ACH_ZERO_LEAK_WEEK)
        }
        if (player.perfectScenarioStreak >= 10) {
            unlockAchievement(existing, newAchievements, ACH_TEN_PERFECT)
        }

        player.achievementIdsCsv = joinCsv(existing)
        promoteIfNeeded(player, completed)
        players.save(player)

        return CareerSnapshotDto(
            reputation = player.reputation,
            reputationDelta = 0,
            role = player.role,
            roleChanged = player.role != roleSnapshotBefore,
            perfectScenarioStreak = player.perfectScenarioStreak,
            newAchievements = newAchievements.map { AchievementDto(it.id, it.title, it.description) },
        )
    }

    private fun unlockAchievement(
        existing: MutableSet<String>,
        out: MutableList<AchievementDefinition>,
        id: String,
    ) {
        if (existing.contains(id)) {
            return
        }
        val def = AchievementCatalog.find(id) ?: return
        existing.add(id)
        out.add(def)
    }

    private fun promoteIfNeeded(player: PlayerEntity, completed: Set<String>) {
        if (player.role == CareerRole.INTERN && completed.contains(BASIC_PHISHING)) {
            player.role = CareerRole.EMPLOYEE
        }
        if (player.role.ordinal <= CareerRole.EMPLOYEE.ordinal && BASIC_ALL.all { it in completed }) {
            player.role = CareerRole.SECURITY_ADMIN
        }
    }

    fun toStateDto(player: PlayerEntity): PlayerStateDto {
        val unlocked = parseCsv(player.achievementIdsCsv).toSet()
        val ach = AchievementCatalog.ALL.map {
            PlayerAchievementStateDto(
                id = it.id,
                title = it.title,
                description = it.description,
                unlocked = unlocked.contains(it.id),
            )
        }
        return PlayerStateDto(
            clientId = player.clientId.toString(),
            reputation = player.reputation,
            role = player.role,
            perfectScenarioStreak = player.perfectScenarioStreak,
            completedScenarioIds = parseCsv(player.completedScenarioIdsCsv),
            achievements = ach,
        )
    }

    private fun parseCsv(raw: String): List<String> =
        raw.split(',').map { it.trim() }.filter { it.isNotEmpty() }

    private fun joinCsv(ids: Collection<String>): String = ids.distinct().sorted().joinToString(",")

    companion object {
        const val BASIC_PHISHING = "phishing-email"
        private const val ACH_FIRST_PHISHING = "first-phishing-spotless"
        private const val ACH_ZERO_LEAK_WEEK = "zero-leak-week"
        private const val ACH_TEN_PERFECT = "ten-perfect-row"

        val BASIC_ALL: Set<String> = setOf(
            BASIC_PHISHING,
            "social-prize",
            "malicious-attachment",
        )
    }
}
