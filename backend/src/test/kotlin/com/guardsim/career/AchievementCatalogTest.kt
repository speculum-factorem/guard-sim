package com.guardsim.career

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class AchievementCatalogTest {
    @Test
    fun `all achievement ids are unique`() {
        val ids = AchievementCatalog.ALL.map { it.id }
        assertEquals(ids.size, ids.toSet().size)
    }

    @Test
    fun `find returns known definition`() {
        val d = AchievementCatalog.find("trust-80")
        assertNotNull(d)
        assertEquals("Высокое доверие", d!!.title)
    }

    @Test
    fun `find returns null for unknown id`() {
        assertNull(AchievementCatalog.find("no-such-achievement"))
    }

    @Test
    fun `catalog is non-empty`() {
        assertTrue(AchievementCatalog.ALL.isNotEmpty())
    }
}
