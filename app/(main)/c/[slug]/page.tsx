import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleFeed } from "@/components/circle-feed";
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

  const initialHref = sort === "top" ? `/c/${circle.slug}?sort=top` : `/c/${circle.slug}`;

  return (
    <CircleFeed
      initialHref={initialHref}
      initialFeed={{
        title: circle.name,
        description: circle.description,
        sort,
        basePath: `/c/${circle.slug}`,
        createHref: `/new?c=${circle.slug}`,
        createLabel: `Start a thread in ${circle.name}…`,
        empty: "Nothing in this circle yet.",
        posts,
      }}
    />
  );
}
