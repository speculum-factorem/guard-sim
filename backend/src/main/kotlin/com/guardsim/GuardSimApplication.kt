package com.guardsim

import com.guardsim.config.JwtProperties
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication

@SpringBootApplication(exclude = [UserDetailsServiceAutoConfiguration::class])
@EnableConfigurationProperties(JwtProperties::class)
class GuardSimApplication

fun main(args: Array<String>) {
    runApplication<GuardSimApplication>(*args)
}
