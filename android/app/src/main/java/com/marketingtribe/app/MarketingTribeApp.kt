package com.marketingtribe.app

import android.app.Application
import android.webkit.CookieManager

class MarketingTribeApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.flush()
    }
}
