import { getCommunity, listPosts } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in to view this feed." }, { status: 401, headers: privateHeaders });
  }
  if (user.welcome_read_at === null) {
    return Response.json({ error: "Read the welcome thread before entering the room." }, { status: 403, headers: privateHeaders });
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "";
  const sort = url.searchParams.get("sort") === "top" ? "top" : "new";
  const query = path === "/home" ? url.searchParams.get("q")?.trim().slice(0, 80) || undefined : undefined;

  if (path === "/home") {
    const posts = await listPosts({ viewerId: user.id, sort, query });
    return Response.json(
      {
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
      },
      { headers: privateHeaders },
    );
  }

  const match = /^\/c\/([a-z0-9-]+)$/.exec(path);
  if (!match) {
    return Response.json({ error: "That feed does not exist." }, { status: 404, headers: privateHeaders });
  }

  const slug = match[1];
  const circle = await getCommunity(slug);
  if (!circle) {
    return Response.json({ error: "That circle does not exist." }, { status: 404, headers: privateHeaders });
  }
  const posts = await listPosts({ viewerId: user.id, communitySlug: slug, sort });

  return Response.json(
    {
      title: circle.name,
      description: circle.description,
      sort,
      basePath: `/c/${circle.slug}`,
      createHref: `/new?c=${circle.slug}`,
      createLabel: `Start a thread in ${circle.name}…`,
      empty: "Nothing in this circle yet.",
      posts,
    },
    { headers: privateHeaders },
  );
}
