package com.guardsim.player

import java.time.LocalDate
import java.time.ZoneId

/** Понедельник текущей недели в локальной зоне — как на фронте в weeklyGoalStorage. */
fun mondayDateKey(zoneId: ZoneId = ZoneId.systemDefault()): String {
    val today = LocalDate.now(zoneId)
    val dow = today.dayOfWeek.value
    val daysBack = (dow + 6) % 7
    val monday = today.minusDays(daysBack.toLong())
    return String.format("%04d-%02d-%02d", monday.year, monday.monthValue, monday.dayOfMonth)
}
