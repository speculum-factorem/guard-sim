package com.guardsim.player

import com.guardsim.career.AchievementCatalog
import com.guardsim.career.AchievementDefinition
import com.guardsim.dto.AchievementDto
import com.guardsim.dto.CareerSnapshotDto
import com.guardsim.dto.PlayerAchievementStateDto
import com.guardsim.dto.PlayerStateDto
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class PlayerService(
    private val players: PlayerRepository,
) {

    /** Уровень 1 при 0–99 XP, уровень 2 при 100–199 и т.д. */
    fun levelFromExperience(exp: Int): Int = exp.coerceAtLeast(0) / 100 + 1

    /**
     * Два параллельных запроса с одним [clientId] могли оба не увидеть строку и попытаться INSERT — ловим и читаем существующую.
     */
    @Transactional
    fun getOrCreate(clientId: UUID): PlayerEntity =
        players.findById(clientId).orElseGet {
            try {
                players.save(PlayerEntity(clientId = clientId))
            } catch (ex: DataIntegrityViolationException) {
                players.findById(clientId).orElseThrow { ex }
            }
        }

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
    ): CareerSnapshotDto {
        val completed = parseCsv(player.completedScenarioIdsCsv).toMutableSet()
        completed.add(scenarioId)
        player.completedScenarioIdsCsv = joinCsv(completed)

        if (!hadIncorrectStep) {
            player.perfectScenarioStreak += 1
        } else {
            player.perfectScenarioStreak = 0
        }

        val levelBefore = levelFromExperience(player.experiencePoints)
        val xpGain = if (hadIncorrectStep) 25 else 45
        player.experiencePoints = (player.experiencePoints + xpGain).coerceAtMost(1_000_000)

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

        if (TRACK_INBOX.all { it in completed }) {
            unlockAchievement(existing, newAchievements, ACH_TRACK_INBOX)
        }
        if (TRACK_SOCIAL.all { it in completed }) {
            unlockAchievement(existing, newAchievements, ACH_TRACK_SOCIAL)
        }
        if (TRACK_SOC.all { it in completed }) {
            unlockAchievement(existing, newAchievements, ACH_TRACK_SOC)
        }

        player.achievementIdsCsv = joinCsv(existing)
        players.save(player)

        val levelAfter = levelFromExperience(player.experiencePoints)

        return CareerSnapshotDto(
            reputation = player.reputation,
            reputationDelta = 0,
            experience = player.experiencePoints,
            experienceDelta = xpGain,
            level = levelAfter,
            levelChanged = levelAfter > levelBefore,
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
            experience = player.experiencePoints,
            level = levelFromExperience(player.experiencePoints),
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
        private const val ACH_TRACK_INBOX = "challenge-track-inbox"
        private const val ACH_TRACK_SOCIAL = "challenge-track-social"
        private const val ACH_TRACK_SOC = "challenge-track-soc"

        private val TRACK_INBOX: Set<String> = setOf(
            "phishing-email",
            "malicious-attachment",
            "vendor-payment-bec",
            "hr-portal-phish",
            "it-support-lookalike",
        )
        private val TRACK_SOCIAL: Set<String> = setOf(
            "social-prize",
            "marketplace-off-platform",
        )
        private val TRACK_SOC: Set<String> = setOf(
            "combined-ceo-phish",
            "exec-wire-vishing",
        )
    }
}
