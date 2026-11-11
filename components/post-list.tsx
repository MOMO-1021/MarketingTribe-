"use client";

import Link from "next/link";
import type { PostCard } from "@/lib/db";
import { excerpt, formatTime, plural } from "@/lib/format";
import { useCircleFeedStore } from "./circle-feed-provider";
import { VoteButton } from "./vote-button";

export function PostList({ posts, empty }: { posts: PostCard[]; empty: string }) {
  const { navigate, prefetchFeed } = useCircleFeedStore();

  if (posts.length === 0) {
    return <p className="border-t border-line py-10 text-sm text-mute">{empty}</p>;
  }

  return (
    <div className="border-t border-line">
      {posts.map((post) => (
        <article key={post.id} className="flex gap-2 border-b border-line py-4">
          <VoteButton postId={post.id} score={post.score} voted={post.voted} />
          <div className="min-w-0">
            <h2 className="font-serif text-xl leading-snug tracking-tight">
              <Link href={`/p/${post.id}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            {excerpt(post.body) ? (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-mute">{excerpt(post.body)}</p>
            ) : null}
            <p className="mt-2 text-xs text-mute">
              <Link
                href={`/c/${post.community_slug}`}
                prefetch={false}
                onMouseEnter={() => prefetchFeed(`/c/${post.community_slug}`)}
                onFocus={() => prefetchFeed(`/c/${post.community_slug}`)}
                onClick={(event) => {
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
                  navigate(`/c/${post.community_slug}`);
                }}
                className="hover:text-ink"
              >
                {post.community_name}
              </Link>
              <span> · </span>
              <Link href={`/u/${post.author_id}`} className="hover:text-ink">
                {post.author_name}
              </Link>
              <span> · {post.author_city} · </span>
              <time dateTime={new Date(post.created_at).toISOString()}>{formatTime(post.created_at)}</time>
              <span> · </span>
              <Link href={`/p/${post.id}`} className="hover:text-ink">
                {plural(post.comment_count, "reply", "replies")}
              </Link>
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
