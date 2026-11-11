import type { Metadata } from "next";
import { CircleFeed } from "@/components/circle-feed";
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
  const search = new URLSearchParams();
  if (sort === "top") search.set("sort", "top");
  if (query) search.set("q", query);
  const searchString = search.toString();

  return (
    <CircleFeed
      initialHref={searchString ? `/home?${searchString}` : "/home"}
      initialFeed={{
        title: query ? "Search" : "All circles",
        description: query
          ? `Threads matching “${query}”.`
          : "The latest from marketers in the room. Start one when you have something specific.",
        sort,
        basePath: "/home",
        query,
        createHref: "/new",
        createLabel: "Start a thread…",
        empty: query ? "Nothing matches that." : "The room is quiet. Start the first thread.",
        posts,
      }}
    />
  );
}
