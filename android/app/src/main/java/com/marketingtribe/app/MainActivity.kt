package com.marketingtribe.app

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var pageProgressBar: ProgressBar
    private lateinit var offlineContainer: LinearLayout
    private lateinit var btnRetry: Button

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var lastBackPressTime: Long = 0L

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (fileUploadCallback == null) return@registerForActivityResult

        val resultUris: Array<Uri>? = when {
            result.resultCode != RESULT_OK -> null
            result.data?.clipData != null -> {
                val clipData = result.data!!.clipData!!
                Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
            }
            result.data?.data != null -> arrayOf(result.data!!.data!!)
            else -> null
        }

        fileUploadCallback?.onReceiveValue(resultUris)
        fileUploadCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_MarketingTribe)
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupWebView()
        setupSwipeRefresh()
        setupBackNavigation()
        handleIntent(intent)
    }

    private fun initViews() {
        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        pageProgressBar = findViewById(R.id.pageProgressBar)
        offlineContainer = findViewById(R.id.offlineContainer)
        btnRetry = findViewById(R.id.btnRetry)

        btnRetry.setOnClickListener {
            retryConnection()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        settings.userAgentString = settings.userAgentString + AppConfig.USER_AGENT_SUFFIX
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false

        // Cross-device Session Synchronization via persistent CookieManager
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val uri = request?.url ?: return false
                return handleUrlNavigation(uri)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url == null) return false
                return handleUrlNavigation(Uri.parse(url))
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                pageProgressBar.visibility = View.VISIBLE
                pageProgressBar.progress = 10
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                pageProgressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false

                // Flush auth session cookies to persistent storage
                CookieManager.getInstance().flush()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    showOfflineView()
                }
            }

            @Deprecated("Deprecated in Java")
            override fun onReceivedError(
                view: WebView?,
                errorCode: Int,
                description: String?,
                failingUrl: String?
            ) {
                super.onReceivedError(view, errorCode, description, failingUrl)
                showOfflineView()
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                pageProgressBar.progress = newProgress
                if (newProgress >= 100) {
                    pageProgressBar.visibility = View.GONE
                }
            }

            override fun onShowFileChooser(
                view: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "*/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }

                try {
                    fileChooserLauncher.launch(intent)
                } catch (e: ActivityNotFoundException) {
                    fileUploadCallback = null
                    Toast.makeText(this@MainActivity, "No file manager found", Toast.LENGTH_SHORT).show()
                    return false
                }
                return true
            }
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.setColorSchemeResources(
            R.color.ink,
            R.color.accent_terracotta
        )
        swipeRefresh.setProgressBackgroundColorSchemeResource(R.color.bg_paper)

        // Only allow pull-to-refresh when at the top of the page
        webView.viewTreeObserver.addOnScrollChangedListener {
            swipeRefresh.isEnabled = (webView.scrollY == 0)
        }

        swipeRefresh.setOnRefreshListener {
            if (NetworkHelper.isNetworkAvailable(this)) {
                offlineContainer.visibility = View.GONE
                webView.visibility = View.VISIBLE
                webView.reload()
            } else {
                swipeRefresh.isRefreshing = false
                showOfflineView()
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (offlineContainer.visibility == View.VISIBLE) {
                    if (webView.canGoBack()) {
                        offlineContainer.visibility = View.GONE
                        webView.visibility = View.VISIBLE
                        webView.goBack()
                        return
                    }
                }

                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    val currentTime = System.currentTimeMillis()
                    if (currentTime - lastBackPressTime < 2000) {
                        isEnabled = false
                        finish()
                    } else {
                        lastBackPressTime = currentTime
                        Toast.makeText(
                            this@MainActivity,
                            "Press back again to exit MarketingTribe",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            }
        })
    }

    private fun handleUrlNavigation(uri: Uri): Boolean {
        val host = uri.host ?: ""
        val scheme = uri.scheme ?: ""

        // Handle custom scheme deep links
        if (scheme.equals(AppConfig.DEEP_LINK_SCHEME, ignoreCase = true)) {
            val destinationPath = uri.encodedPath ?: ""
            val fullUrl = "${AppConfig.activeUrl}$destinationPath"
            webView.loadUrl(fullUrl)
            return true
        }

        // Keep internal MarketingTribe navigation inside the native WebView
        if (host.contains(AppConfig.PRODUCTION_HOST) ||
            host == "localhost" ||
            host == "10.0.2.2" ||
            host == "127.0.0.1"
        ) {
            return false // Let WebView load it
        }

        // Open external links (e.g. external articles in quizzes, external profiles) in device browser
        return try {
            val externalIntent = Intent(Intent.ACTION_VIEW, uri)
            startActivity(externalIntent)
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun handleIntent(intent: Intent?) {
        val targetUri = intent?.data
        if (targetUri != null) {
            val targetUrl = when {
                targetUri.scheme.equals(AppConfig.DEEP_LINK_SCHEME, ignoreCase = true) -> {
                    "${AppConfig.activeUrl}${targetUri.encodedPath ?: ""}"
                }
                targetUri.host?.contains(AppConfig.PRODUCTION_HOST) == true -> {
                    targetUri.toString()
                }
                else -> AppConfig.activeUrl
            }
            loadUrl(targetUrl)
        } else {
            loadUrl(AppConfig.activeUrl)
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun loadUrl(url: String) {
        if (!NetworkHelper.isNetworkAvailable(this)) {
            showOfflineView()
            return
        }

        offlineContainer.visibility = View.GONE
        webView.visibility = View.VISIBLE
        webView.loadUrl(url)
    }

    private fun showOfflineView() {
        webView.visibility = View.GONE
        offlineContainer.visibility = View.VISIBLE
        swipeRefresh.isRefreshing = false
    }

    private fun retryConnection() {
        if (NetworkHelper.isNetworkAvailable(this)) {
            offlineContainer.visibility = View.GONE
            webView.visibility = View.VISIBLE
            val current = webView.url
            if (!current.isNullOrEmpty()) {
                webView.reload()
            } else {
                webView.loadUrl(AppConfig.activeUrl)
            }
        } else {
            Toast.makeText(
                this,
                "No connection yet. Please check your Wi-Fi or mobile data.",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        CookieManager.getInstance().flush()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
        CookieManager.getInstance().flush()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
