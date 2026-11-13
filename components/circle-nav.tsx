"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CommunitySummary } from "@/lib/db";
import { useCircleFeedStore } from "./circle-feed-provider";

export function CircleNav({ circles }: { circles: CommunitySummary[] }) {
  const path = usePathname();
  const { navigate, prefetchFeed, prefetchPeople } = useCircleFeedStore();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
      <NavLink
        href="/home"
        active={path === "/home"}
        navigate={navigate}
        onPrefetch={() => prefetchFeed("/home")}
      >
        All circles
      </NavLink>
      {circles.map((circle) => (
        <NavLink
          key={circle.slug}
          href={`/c/${circle.slug}`}
          active={path === `/c/${circle.slug}`}
          navigate={navigate}
          onPrefetch={() => prefetchFeed(`/c/${circle.slug}`)}
        >
          {circle.name}
        </NavLink>
      ))}
      <div className="mx-1 hidden border-t border-line md:my-3 md:block" />
      <NavLink
        href="/people"
        active={path === "/people"}
        navigate={navigate}
        onPrefetch={prefetchPeople}
      >
        People
      </NavLink>
      <NavLink href="/quizzes" active={path === "/quizzes" || path.startsWith("/quizzes/")}>
        Weekly quizzes
      </NavLink>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
  navigate,
  onPrefetch,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
  navigate?: (href: string) => void;
  onPrefetch?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch={navigate ? false : undefined}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      onClick={(event) => {
        if (
          !navigate ||
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
        navigate(href);
      }}
      className={`shrink-0 rounded-full border px-3 py-1 text-sm md:rounded-md md:border-0 md:px-2 md:py-1.5 ${
        active
          ? "border-ink bg-ink text-paper md:bg-transparent md:text-ink md:font-medium"
          : "border-line text-mute hover:text-ink"
      }`}
    >
      <span>{children}</span>
    </Link>
  );
}
