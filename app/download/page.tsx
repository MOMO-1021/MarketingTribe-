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
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
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

          {/* Download Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <a
              href="/downloads/MarketingTribe.apk"
              download="MarketingTribe.apk"
              className="btn-large w-full sm:w-auto text-base gap-2 px-8 py-3.5 shadow-sm"
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
        <section className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 border-t border-line pt-12">
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
              Post a thread from your phone on the subway, continue replying from your desk. Everything stays in lockstep.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white/60 p-5">
            <div className="text-xl">📱</div>
            <h2 className="mt-2 font-serif text-lg">Native Android Feel</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-mute">
              Pull-to-refresh feeds, persistent login so you don&apos;t get logged out, and clean offline support.
            </p>
          </div>
        </section>

        {/* Installation Instructions */}
        <section className="mt-14 rounded-2xl border border-line bg-white/80 p-6 sm:p-8">
          <h2 className="font-serif text-2xl tracking-tight">How to install on your phone</h2>
          <p className="mt-2 text-sm text-mute">
            Follow these simple steps to install the Android app directly on your phone:
          </p>

          <ol className="mt-6 space-y-4 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
                1
              </span>
              <div>
                <strong className="text-ink">Download the APK:</strong> Tap the{" "}
                <strong className="text-ink">Download Android App</strong> button above on your Android phone.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
                2
              </span>
              <div>
                <strong className="text-ink">Open & Install:</strong> Once downloaded, tap the notification or file in your Downloads. If Android prompts <em>&ldquo;Install unknown apps&rdquo;</em>, allow permission for your browser.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
                3
              </span>
              <div>
                <strong className="text-ink">Log in:</strong> Open MarketingTribe and log in with your existing account. All your circles, quizzes, and threads will be right there.
              </div>
            </li>
          </ol>

          {/* Alternative Web App Installation */}
          <div className="mt-8 border-t border-line pt-6">
            <h3 className="font-serif text-lg">Alternative: Install directly from Chrome (Instant)</h3>
            <p className="mt-2 text-sm text-mute leading-relaxed">
              Prefer not to download an APK? Open <span className="font-mono text-xs text-ink">marketingtribe</span> in Chrome on your phone, tap the <strong>⋮ (three dots)</strong> menu in the top right, and select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.
            </p>
          </div>
        </section>

        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-mute">
          MarketingTribe · Exclusive for marketing students & aspiring marketers
        </div>
      </main>
    </div>
  );
}
