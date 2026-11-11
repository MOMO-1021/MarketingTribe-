import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedBar } from "@/components/feed-bar";
import { PostList } from "@/components/post-list";
import { getCommunity, listPosts } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const circle = await getCommunity(slug);
  return { title: circle?.name ?? "Circle" };
}

export default async function CirclePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { slug } = await params;
  const { sort: sortParam } = await searchParams;
  const sort = sortParam === "top" ? "top" : "new";
  const [circle, posts] = await Promise.all([
    getCommunity(slug),
    listPosts({ viewerId: user.id, communitySlug: slug, sort }),
  ]);
  if (!circle) notFound();

  return (
    <div>
      <FeedBar title={circle.name} description={circle.description} sort={sort} basePath={`/c/${circle.slug}`} />
      <Link
        href={`/new?c=${circle.slug}`}
        className="mb-2 block rounded-lg border border-dashed border-line px-4 py-3 text-sm text-mute hover:border-ink/30 hover:text-ink"
      >
        Start a thread in {circle.name}…
      </Link>
      <PostList posts={posts} empty="Nothing in this circle yet." />
    </div>
  );
}
