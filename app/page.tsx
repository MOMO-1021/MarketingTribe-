import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Wordmark } from "@/components/wordmark";
import { getStats } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-20">
      <p className="text-xs uppercase tracking-[0.16em] text-mute">Marketers · India</p>
      <div className="mt-4">
        <Wordmark href="/" />
      </div>
      <h1 className="mt-6 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
        A small room to talk shop.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-ink/80">
        MarketingTribe is a quiet alternative to the big forums. It is only for marketers in India,
        and only people with an account can come in. No anonymous crowd, no browsing from the doorway.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link href="/signup" className="btn-large">
          Create an account
        </Link>
        <Link href="/login" className="text-sm text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
          Sign in
        </Link>
      </div>
      <Suspense
        fallback={
          <p className="mt-8 text-sm text-mute" aria-busy="true">
            Checking how many members are inside…
          </p>
        }
      >
        <MemberCount />
      </Suspense>
      <div className="mt-10 border-t border-line pt-6 text-sm leading-relaxed text-mute">
        Circles for performance, content, SEO, social, brand, D2C, B2B, influencer work, and careers.
        Bring a specific question, or something you already tried.
      </div>
    </main>
  );
}

async function MemberCount() {
  const stats = await getStats();
  return (
    <p className="mt-8 text-sm text-mute">
      {stats.members === 0
        ? "The room is open. Be the first member."
        : `${stats.members} ${stats.members === 1 ? "member is" : "members are"} already inside.`}
    </p>
  );
}
