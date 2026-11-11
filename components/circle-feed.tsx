"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/loading-state";
import { PostList } from "@/components/post-list";
import { FeedBar } from "@/components/feed-bar";
import {
  normalizeHref,
  useCircleFeedStore,
  type CircleFeedData,
} from "./circle-feed-provider";

export function CircleFeed({
  initialHref,
  initialFeed,
}: {
  initialHref: string;
  initialFeed: CircleFeedData;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const store = useCircleFeedStore();
  const sort = searchParams.get("sort") === "top" ? "top" : "new";
  const query = pathname === "/home" ? searchParams.get("q")?.trim().slice(0, 80) || undefined : undefined;
  const params = new URLSearchParams();
  if (sort === "top") params.set("sort", "top");
  if (query) params.set("q", query);
  const search = params.toString();
  const currentHref = normalizeHref(`${pathname}${search ? `?${search}` : ""}`);
  const initialKey = normalizeHref(initialHref);
  const cachedInitialFeed = store.getFeed(initialHref);
  const hadCachedInitialFeed = useRef(cachedInitialFeed !== undefined);
  store.seedFeed(initialHref, initialFeed);

  const [, setFeed] = useState<CircleFeedData | undefined>(
    () => cachedInitialFeed ?? initialFeed,
  );
  const firstView = useRef(true);
  const [error, setError] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const visibleFeed =
    store.getFeed(currentHref) ?? (currentHref === initialKey ? initialFeed : undefined);

  useEffect(() => {
    let active = true;
    const firstRenderOfInitialRoute = firstView.current && currentHref === initialKey;
    firstView.current = false;
    if (firstRenderOfInitialRoute && !hadCachedInitialFeed.current) {
      return () => {
        active = false;
      };
    }

    const cached = store.getFeed(currentHref);
    setError(false);
    setRefreshError(false);

    if (cached) {
      setFeed(cached);
      void store.loadFeed(currentHref).then(
        (fresh) => {
          if (active) setFeed(fresh);
        },
        () => {
          if (active) setRefreshError(true);
        },
      );
    } else {
      setFeed(undefined);
      void store.loadFeed(currentHref).then(
        (fresh) => {
          if (active) setFeed(fresh);
        },
        () => {
          if (active) setError(true);
        },
      );
    }

    return () => {
      active = false;
    };
  }, [currentHref, initialKey, store]);

  useEffect(() => {
    if (visibleFeed) document.title = `${visibleFeed.title} · MarketingTribe`;
  }, [visibleFeed?.title]);

  if (!visibleFeed && !error) return <LoadingState message="Loading this circle…" feed />;
  if (!visibleFeed && error) {
    return (
      <div role="alert" className="border-t border-line py-8 text-sm text-mute">
        <p>Couldn’t load this circle.</p>
        <button
          type="button"
          onClick={() => {
            setError(false);
            void store.loadFeed(currentHref).then(
              setFeed,
              () => setError(true),
            );
          }}
          className="mt-2 text-ink underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!visibleFeed) return null;

  return (
    <div>
      <FeedBar
        title={visibleFeed.title}
        description={visibleFeed.description}
        sort={sort}
        basePath={visibleFeed.basePath}
        query={query}
      />
      {refreshError ? (
        <p role="status" className="mb-2 text-xs text-mute">
          Couldn’t refresh this feed; showing saved threads.
        </p>
      ) : null}
      <Link
        href={visibleFeed.createHref}
        className="mb-2 block rounded-lg border border-dashed border-line px-4 py-3 text-sm text-mute hover:border-ink/30 hover:text-ink"
      >
        {visibleFeed.createLabel}
      </Link>
      <PostList posts={visibleFeed.posts} empty={visibleFeed.empty} />
    </div>
  );
}
