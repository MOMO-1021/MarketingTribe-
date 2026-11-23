package com.marketingtribe.app

object AppConfig {
    const val PRODUCTION_URL = "https://marketingtribe-momo-1021.netlify.app"
    const val LOCAL_EMULATOR_URL = "http://10.0.2.2:3000"
    var activeUrl: String = PRODUCTION_URL
    const val USER_AGENT_SUFFIX = " MarketingTribe-Android/1.0.0"
    const val DEEP_LINK_SCHEME = "marketingtribe"
    const val PRODUCTION_HOST = "marketingtribe-momo-1021.netlify.app"
    const val SESSION_COOKIE_NAME = "adda_session"
}
