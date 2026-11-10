import type { Metadata } from "next";
import Link from "next/link";
import { FeedBar } from "@/components/feed-bar";
import { PostList } from "@/components/post-list";
import { listPosts } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const params = await searchParams;
  const sort = params.sort === "top" ? "top" : "new";
  const query = params.q?.trim().slice(0, 80) || undefined;
  const posts = await listPosts({ viewerId: user.id, sort, query });

  return (
    <div>
      <FeedBar
        title={query ? `Search` : "All circles"}
        description={
          query
            ? `Threads matching “${query}”.`
            : "The latest from marketers in the room. Start one when you have something specific."
        }
        sort={sort}
        basePath="/home"
        query={query}
      />
      <Link
        href="/new"
        className="mb-2 block rounded-lg border border-dashed border-line px-4 py-3 text-sm text-mute hover:border-ink/30 hover:text-ink"
      >
        Start a thread…
      </Link>
      <PostList
        posts={posts}
        empty={query ? "Nothing matches that." : "The room is quiet. Start the first thread."}
      />
    </div>
  );
}
