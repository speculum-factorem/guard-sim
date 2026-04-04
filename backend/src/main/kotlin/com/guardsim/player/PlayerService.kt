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
        val levelBefore = levelFromExperience(player.experiencePoints)
        val existing = parseCsv(player.achievementIdsCsv).toMutableSet()
        val newAchievements = mutableListOf<AchievementDefinition>()
        var xpGain = 0

        if (!hadIncorrectStep) {
            // ── Безошибочное прохождение: засчитываем, выдаём XP и прогресс ──
            val completed = parseCsv(player.completedScenarioIdsCsv).toMutableSet()
            completed.add(scenarioId)
            player.completedScenarioIdsCsv = joinCsv(completed)

            player.perfectScenarioStreak += 1
            xpGain = 45
            bumpWeeklyGoal(player)

            if (scenarioId == BASIC_PHISHING) {
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
            if (TRACK_CONSUMER.all { it in completed }) {
                unlockAchievement(existing, newAchievements, ACH_TRACK_CONSUMER)
            }
            if (TRACK_SMOKESCREEN.all { it in completed }) {
                unlockAchievement(existing, newAchievements, ACH_TRACK_SMOKESCREEN)
            }
            if (TRACK_MALWARE_ENDPOINTS.all { it in completed }) {
                unlockAchievement(existing, newAchievements, ACH_TRACK_MALWARE)
            }
            if (TRACK_SEARCH_PERIMETER.all { it in completed }) {
                unlockAchievement(existing, newAchievements, ACH_TRACK_SEARCH_PERIMETER)
            }
            if (TRACK_BENIGN.all { it in completed }) {
                unlockAchievement(existing, newAchievements, ACH_TRACK_BENIGN)
            }
        } else {
            // ── Были ошибки: задание НЕ засчитывается, XP не выдаётся, стрик сбрасывается ──
            player.perfectScenarioStreak = 0
            xpGain = 0
        }

        if (player.reputation >= 80) {
            unlockAchievement(existing, newAchievements, ACH_TRUST_80)
        }
        if (player.reputation >= 95) {
            unlockAchievement(existing, newAchievements, ACH_TRUST_95)
        }

        player.achievementIdsCsv = joinCsv(existing)
        if (xpGain > 0) {
            player.experiencePoints = (player.experiencePoints + xpGain).coerceAtMost(1_000_000)
        }
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
        val weekKey = mondayDateKey()
        val weeklyCurrent = if (player.weeklyGoalWeekStart == weekKey) player.weeklyGoalCount else 0
        return PlayerStateDto(
            clientId = player.clientId.toString(),
            reputation = player.reputation,
            experience = player.experiencePoints,
            level = levelFromExperience(player.experiencePoints),
            perfectScenarioStreak = player.perfectScenarioStreak,
            completedScenarioIds = parseCsv(player.completedScenarioIdsCsv),
            achievements = ach,
            weeklyGoalCurrent = weeklyCurrent,
            weeklyGoalTarget = WEEKLY_GOAL_TARGET,
            weeklyGoalWeekStart = weekKey,
        )
    }

    private fun bumpWeeklyGoal(player: PlayerEntity) {
        val monday = mondayDateKey()
        if (player.weeklyGoalWeekStart != monday) {
            player.weeklyGoalWeekStart = monday
            player.weeklyGoalCount = 1
        } else {
            player.weeklyGoalCount += 1
        }
    }

    private fun parseCsv(raw: String): List<String> =
        raw.split(',').map { it.trim() }.filter { it.isNotEmpty() }

    private fun joinCsv(ids: Collection<String>): String = ids.distinct().sorted().joinToString(",")

    companion object {
        const val WEEKLY_GOAL_TARGET = 3
        const val BASIC_PHISHING = "phishing-email"
        private const val ACH_FIRST_PHISHING = "first-phishing-spotless"
        private const val ACH_ZERO_LEAK_WEEK = "zero-leak-week"
        private const val ACH_TEN_PERFECT = "ten-perfect-row"
        private const val ACH_TRACK_INBOX = "challenge-track-inbox"
        private const val ACH_TRACK_SOCIAL = "challenge-track-social"
        private const val ACH_TRACK_SOC = "challenge-track-soc"
        private const val ACH_TRACK_CONSUMER = "challenge-track-consumer"
        private const val ACH_TRACK_SMOKESCREEN = "challenge-track-smokescreen"
        private const val ACH_TRACK_MALWARE = "challenge-track-malware-endpoints"
        private const val ACH_TRACK_SEARCH_PERIMETER = "challenge-track-search-perimeter"
        private const val ACH_TRACK_BENIGN = "challenge-track-benign"
        private const val ACH_TRUST_80 = "trust-80"
        private const val ACH_TRUST_95 = "trust-95"

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
        private val TRACK_CONSUMER: Set<String> = setOf(
            "smishing-bank-card-unblock",
            "vishing-bank-fake-security-call",
            "credential-stuffing-fake-lockout",
            "chat-friend-new-card-scam",
        )
        private val TRACK_SMOKESCREEN: Set<String> = setOf(
            "sms-bomber-phishing-smokescreen",
        )
        private val TRACK_MALWARE_ENDPOINTS: Set<String> = setOf(
            "vpn-colleague-virustotal-clean",
            "winlocker-safe-mode-cleanup",
            "rat-incident-response",
        )
        private val TRACK_SEARCH_PERIMETER: Set<String> = setOf(
            "search-bank-official-serp",
            "perimeter-ddos-net-shield",
        )
        private val TRACK_BENIGN: Set<String> = setOf(
            "email-it-maintenance-benign",
            "messenger-internal-benign",
            "calendar-legit-invite",
            "extension-allowlist-benign",
        )
    }
}
