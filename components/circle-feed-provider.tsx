"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import type { PostCard } from "@/lib/db";

export type CircleFeedData = {
  title: string;
  description?: string;
  sort: "new" | "top";
  basePath: string;
  query?: string;
  createHref: string;
  createLabel: string;
  empty: string;
  posts: PostCard[];
};

type CircleFeedStore = {
  getFeed: (href: string) => CircleFeedData | undefined;
  seedFeed: (href: string, feed: CircleFeedData) => void;
  loadFeed: (href: string) => Promise<CircleFeedData>;
  prefetchFeed: (href: string) => void;
  navigate: (href: string) => void;
};

const CircleFeedContext = createContext<CircleFeedStore | null>(null);

export function CircleFeedProvider({ children }: { children: ReactNode }) {
  const feeds = useRef(new Map<string, CircleFeedData>());
  const requests = useRef(new Map<string, Promise<CircleFeedData>>());

  const getFeed = useCallback((href: string) => feeds.current.get(normalizeHref(href)), []);

  const seedFeed = useCallback((href: string, feed: CircleFeedData) => {
    const key = normalizeHref(href);
    if (!feeds.current.has(key)) feeds.current.set(key, feed);
  }, []);

  const loadFeed = useCallback((href: string) => {
    const key = normalizeHref(href);
    const existing = requests.current.get(key);
    if (existing) return existing;

    const url = new URL(key, window.location.origin);
    const params = new URLSearchParams({ path: url.pathname });
    const sort = url.searchParams.get("sort");
    const query = url.searchParams.get("q");
    if (sort === "top") params.set("sort", sort);
    if (query) params.set("q", query);

    const request = fetch(`/api/feeds?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("The circle feed could not be loaded.");
        const payload: unknown = await response.json();
        if (!isCircleFeedData(payload)) throw new Error("The circle feed returned invalid data.");
        feeds.current.set(key, payload);
        return payload;
      })
      .finally(() => {
        requests.current.delete(key);
      });

    requests.current.set(key, request);
    return request;
  }, []);

  const prefetchFeed = useCallback(
    (href: string) => {
      if (getFeed(href)) return;
      void loadFeed(href).catch(() => {});
    },
    [getFeed, loadFeed],
  );

  const navigate = useCallback((href: string) => {
    const nextHref = normalizeHref(href);
    const currentHref = normalizeHref(
      `${window.location.pathname}${window.location.search}`,
    );
    if (nextHref !== currentHref) window.history.pushState(null, "", nextHref);
  }, []);

  const store = useMemo(
    () => ({ getFeed, seedFeed, loadFeed, prefetchFeed, navigate }),
    [getFeed, seedFeed, loadFeed, prefetchFeed, navigate],
  );

  return <CircleFeedContext.Provider value={store}>{children}</CircleFeedContext.Provider>;
}

export function useCircleFeedStore() {
  const store = useContext(CircleFeedContext);
  if (!store) throw new Error("Circle feed components must be rendered inside CircleFeedProvider.");
  return store;
}

export function normalizeHref(href: string) {
  const url = new URL(href, "http://localhost");
  const params = new URLSearchParams();
  if (url.searchParams.get("sort") === "top") params.set("sort", "top");
  const query = url.pathname === "/home" ? url.searchParams.get("q")?.trim().slice(0, 80) : null;
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `${url.pathname}?${search}` : url.pathname;
}

function isCircleFeedData(value: unknown): value is CircleFeedData {
  if (typeof value !== "object" || value === null) return false;
  const feed = value as Record<string, unknown>;
  return (
    typeof feed.title === "string" &&
    (feed.description === undefined || typeof feed.description === "string") &&
    (feed.sort === "new" || feed.sort === "top") &&
    typeof feed.basePath === "string" &&
    (feed.query === undefined || typeof feed.query === "string") &&
    typeof feed.createHref === "string" &&
    typeof feed.createLabel === "string" &&
    typeof feed.empty === "string" &&
    Array.isArray(feed.posts)
  );
}
