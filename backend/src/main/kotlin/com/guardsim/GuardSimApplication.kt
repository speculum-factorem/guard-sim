package com.guardsim

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class GuardSimApplication

fun main(args: Array<String>) {
    runApplication<GuardSimApplication>(*args)
}
