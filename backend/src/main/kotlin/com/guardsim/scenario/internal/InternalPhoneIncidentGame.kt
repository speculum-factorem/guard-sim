package com.guardsim.scenario.internal

data class InternalPhoneSmsLine(
    val sender: String,
    val text: String,
    val time: String,
)

data class InternalPhoneCallOverlay(
    val callerLabel: String,
    val callerSubtitle: String,
    val numberDisplay: String,
)

data class InternalPhoneIncidentGame(
    val statusBarTime: String,
    val networkLabel: String,
    val screenTitle: String,
    val smsLines: List<InternalPhoneSmsLine>,
    val callOverlay: InternalPhoneCallOverlay,
)
