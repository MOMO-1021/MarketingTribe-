"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useCircleFeedStore } from "./circle-feed-provider";

export function FeedBar({
  title,
  description,
  sort,
  basePath,
  query,
}: {
  title: string;
  description?: string;
  sort: "new" | "top";
  basePath: string;
  query?: string;
}) {
  const { navigate, prefetchFeed } = useCircleFeedStore();
  const href = (next: "new" | "top") => {
    const params = new URLSearchParams();
    if (next === "top") params.set("sort", "top");
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const linkProps = (target: string) => ({
    prefetch: false,
    onMouseEnter: () => prefetchFeed(target),
    onFocus: () => prefetchFeed(target),
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      navigate(target);
    },
  });

  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-[1.7rem] tracking-tight">{title}</h1>
        <p className="shrink-0 text-sm text-mute">
          <Link
            href={href("new")}
            {...linkProps(href("new"))}
            className={sort === "new" ? "text-ink" : "hover:text-ink"}
          >
            Latest
          </Link>
          <span> · </span>
          <Link
            href={href("top")}
            {...linkProps(href("top"))}
            className={sort === "top" ? "text-ink" : "hover:text-ink"}
          >
            Top
          </Link>
        </p>
      </div>
      {description ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">{description}</p> : null}
    </div>
  );
}
