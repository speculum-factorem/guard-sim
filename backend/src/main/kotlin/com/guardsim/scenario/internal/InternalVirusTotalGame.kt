package com.guardsim.scenario.internal

data class InternalVirusTotalGame(
    val scannedUrl: String,
    val enginesFlagged: Int,
    val enginesTotal: Int,
    val permalinkStub: String,
    val verdictHeadline: String,
)
