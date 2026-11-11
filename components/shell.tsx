import type { ReactNode } from "react";
import Link from "next/link";
import { logout } from "@/lib/actions";
import { getStats, listCommunities, type PublicUser } from "@/lib/db";
import { CircleNav } from "./circle-nav";
import { CircleFeedProvider } from "./circle-feed-provider";
import { WorkspaceContentBridge } from "./workspace-content-bridge";
import { Wordmark } from "./wordmark";

export async function Shell({ user, children }: { user: PublicUser; children: ReactNode }) {
  const [circles, stats] = await Promise.all([listCommunities(), getStats()]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Wordmark href="/home" />
          <form action="/home" className="min-w-0 flex-1 sm:max-w-xs">
            <input
              name="q"
              placeholder="Search threads"
              aria-label="Search threads"
              className="field py-1.5"
            />
          </form>
          <Link href="/new" className="btn">
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">New thread</span>
          </Link>
          <Link href={`/u/${user.id}`} className="hidden text-sm sm:block">
            <span className="font-medium">{user.name}</span>
            <span className="text-mute"> · {user.city}</span>
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-mute hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <CircleFeedProvider key={user.id}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 md:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[190px_minmax(0,1fr)_230px]">
          <aside>
            <p className="mb-2 hidden text-xs uppercase tracking-[0.14em] text-mute md:block">Circles</p>
            <CircleNav circles={circles} />
          </aside>
          <main className="min-w-0">
            <WorkspaceContentBridge>{children}</WorkspaceContentBridge>
          </main>
          <aside className="hidden lg:block">
            <h2 className="font-serif text-xl tracking-tight">This room</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              A small room for marketers in India. Everyone here has an account. Nobody is browsing from the doorway.
            </p>
            <dl className="mt-4 text-sm">
              <div className="flex justify-between border-t border-line py-2">
                <dt className="text-mute">Members</dt>
                <dd className="tabular-nums">{stats.members}</dd>
              </div>
              <div className="flex justify-between border-t border-line py-2">
                <dt className="text-mute">Threads</dt>
                <dd className="tabular-nums">{stats.threads}</dd>
              </div>
            </dl>
            <h3 className="mt-6 text-xs uppercase tracking-[0.14em] text-mute">Keep it useful</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
              <li>Share what you tried.</li>
              <li>Ask specific questions.</li>
              <li>Skip the pitch unless someone asked.</li>
            </ul>
          </aside>
        </div>
      </CircleFeedProvider>
    </div>
  );
}
