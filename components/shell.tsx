import type { ReactNode } from "react";
import Link from "next/link";
import { getStats, listCommunities, type PublicUser } from "@/lib/db";
import { CircleNav } from "./circle-nav";
import { CircleFeedProvider } from "./circle-feed-provider";
import { WorkspaceContentBridge } from "./workspace-content-bridge";
import { AppHeader } from "./app-header";

export async function Shell({ user, children }: { user: PublicUser; children: ReactNode }) {
  const [circles, stats] = await Promise.all([listCommunities(), getStats()]);

  return (
    <div className="min-h-screen">
      <AppHeader user={user} circles={circles} />
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
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-xs uppercase tracking-[0.14em] text-mute">On your phone</p>
              <p className="mt-1 text-xs leading-relaxed text-mute">
                Use your same account on mobile.
              </p>
              <Link
                href="/download"
                className="mt-2 inline-block text-xs font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
              >
                Get Android app →
              </Link>
            </div>
          </aside>
        </div>
      </CircleFeedProvider>
    </div>
  );
}
