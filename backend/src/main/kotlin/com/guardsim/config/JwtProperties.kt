package com.guardsim.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "guardsim.jwt")
data class JwtProperties(
    /** Секрет HMAC-SHA256, не короче 32 байт в UTF-8 */
    var secret: String = "",
    var expirationMs: Long = 604_800_000L,
)
