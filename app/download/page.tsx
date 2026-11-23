import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Get MarketingTribe for Android",
  description:
    "Download the MarketingTribe Android app. Access your exact same account, circles, threads, and quizzes on your phone and computer.",
};

export default async function DownloadPage() {
  const user = await getCurrentUser();
  const returnHref = user ? "/home" : "/";

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Top Header */}
      <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Wordmark href={returnHref} />
          <Link
            href={returnHref}
            className="text-sm text-mute hover:text-ink transition"
          >
            ← Back to {user ? "circles" : "home"}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center">
          {/* Logo Badge */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-ink shadow-sm">
            <span className="font-serif text-4xl text-paper">M</span>
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-mute">
            Mobile Companion
          </p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            MarketingTribe for Android
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-ink/80">
            Talk shop on the go. Sign in with the exact same account you use on your computer.
            Your threads, comments, weekly quizzes, and upvotes sync in real time.
          </p>

          {/* Primary Action: Direct Download APK */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <a
              href="/api/download"
              download="MarketingTribe.apk"
              className="btn-large w-full sm:w-auto text-base gap-2 px-8 py-3.5 shadow-sm text-center"
            >
              <span>Download Android App (.APK)</span>
            </a>
            <Link
              href={returnHref}
              className="w-full sm:w-auto rounded-full border border-line bg-white/70 px-6 py-3 text-sm font-medium text-ink hover:bg-white transition text-center"
            >
              Continue in Browser
            </Link>
          </div>

          <p className="mt-3 text-xs text-mute">
            Version 1.0.0 · Requires Android 7.0 or higher · Free for all members
          </p>
        </div>

        {/* Feature Grid */}
        <section className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3 border-t border-line pt-10">
          <div className="rounded-xl border border-line bg-white/60 p-5">
            <div className="text-xl">🔄</div>
            <h2 className="mt-2 font-serif text-lg">One Account, Both Devices</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-mute">
              Use your same email and password. Log in on your phone or computer anytime without separate setups.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white/60 p-5">
            <div className="text-xl">⚡</div>
            <h2 className="mt-2 font-serif text-lg">Instant Real-Time Sync</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-mute">
              Post a thread from your phone, continue replying from your desk. Everything stays in lockstep.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white/60 p-5">
            <div className="text-xl">📱</div>
            <h2 className="mt-2 font-serif text-lg">Native Android Feel</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-mute">
              Persistent login so you don&apos;t get logged out, pull-to-refresh feeds, and offline support.
            </p>
          </div>
        </section>

        {/* Simple Installation Guide */}
        <section className="mt-12 rounded-2xl border border-line bg-white/80 p-6 sm:p-8">
          <h2 className="font-serif text-2xl tracking-tight">How to install after downloading</h2>
          
          <ol className="mt-6 space-y-4 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
                1
              </span>
              <div>
                <strong className="text-ink">Tap Download:</strong> Click the <strong className="text-ink">Download Android App (.APK)</strong> button above. If your browser asks &ldquo;File might be harmful&rdquo;, tap <strong className="text-ink">Download anyway</strong> (standard Android warning for direct APK downloads).
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
                2
              </span>
              <div>
                <strong className="text-ink">Open the APK:</strong> Tap the download notification or open <code className="text-xs bg-line/60 px-1.5 py-0.5 rounded">MarketingTribe.apk</code> in your phone&apos;s Downloads.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
                3
              </span>
              <div>
                <strong className="text-ink">Install & Log In:</strong> Tap <strong className="text-ink">Install</strong> (allow unknown sources if prompted). Launch the app and log in with your existing account!
              </div>
            </li>
          </ol>
        </section>

        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-mute">
          MarketingTribe · Exclusive for marketing students & aspiring marketers
        </div>
      </main>
    </div>
  );
}
