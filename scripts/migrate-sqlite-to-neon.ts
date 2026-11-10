import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { getDb, ensureDatabase } from "../lib/db";
import { HOST_EMAIL } from "../lib/constants";

type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  practice: string;
  city: string;
  created_at: number;
};

type CommunityRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
};

type PostRow = {
  id: number;
  user_id: number;
  community_id: number;
  title: string;
  body: string;
  created_at: number;
};

type CommentRow = {
  id: number;
  post_id: number;
  user_id: number;
  body: string;
  created_at: number;
};

type VoteRow = {
  user_id: number;
  post_id: number;
  created_at: number;
};

function requiredId(id: number | undefined, kind: string, sourceId: number) {
  if (id === undefined) throw new Error(`Could not map source ${kind} ${sourceId}.`);
  return id;
}

async function main() {
  loadEnvConfig(process.cwd());
  await ensureDatabase();
  const source = new DatabaseSync(path.join(process.cwd(), "data", "adda.db"));
  const users = source.prepare(`SELECT * FROM users ORDER BY id`).all() as UserRow[];
  const communities = source
    .prepare(`SELECT * FROM communities ORDER BY id`)
    .all() as CommunityRow[];
  const posts = source.prepare(`SELECT * FROM posts ORDER BY id`).all() as PostRow[];
  const comments = source.prepare(`SELECT * FROM comments ORDER BY id`).all() as CommentRow[];
  const votes = source.prepare(`SELECT * FROM votes ORDER BY user_id, post_id`).all() as VoteRow[];

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [827361046]);
    const existing = await client.query<{ members: string; posts: string }>(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE email != $1) AS members,
         (SELECT COUNT(*) FROM posts) AS posts`,
      [HOST_EMAIL],
    );
    if (Number(existing.rows[0].members) > 0 || Number(existing.rows[0].posts) > 1) {
      throw new Error(
        "The Neon database already contains community data. Import into a fresh database to avoid duplicates.",
      );
    }

    const userIds = new Map<number, number>();
    for (const user of users) {
      const result = await client.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, name, practice, city, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           practice = EXCLUDED.practice,
           city = EXCLUDED.city,
           created_at = EXCLUDED.created_at
         RETURNING id`,
        [user.email, user.password_hash, user.name, user.practice, user.city, user.created_at],
      );
      userIds.set(user.id, Number(result.rows[0].id));
    }

    const communityIds = new Map<number, number>();
    for (const community of communities) {
      const result = await client.query<{ id: string }>(
        `INSERT INTO communities (slug, name, description, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           sort_order = EXCLUDED.sort_order
         RETURNING id`,
        [community.slug, community.name, community.description, community.sort_order],
      );
      communityIds.set(community.id, Number(result.rows[0].id));
    }

    const postIds = new Map<number, number>();
    let importedPosts = 0;
    for (const post of posts) {
      const userId = requiredId(userIds.get(post.user_id), "user", post.user_id);
      const communityId = requiredId(
        communityIds.get(post.community_id),
        "community",
        post.community_id,
      );
      if (post.title === "Read this once, then start a real thread") {
        const author = users.find((user) => user.id === post.user_id);
        if (author?.email === HOST_EMAIL) {
          const seeded = await client.query<{ id: string }>(
            `SELECT id FROM posts WHERE user_id = $1 AND title = $2`,
            [userId, post.title],
          );
          if (seeded.rows[0]) {
            postIds.set(post.id, Number(seeded.rows[0].id));
            continue;
          }
        }
      }
      const result = await client.query<{ id: string }>(
        `INSERT INTO posts (user_id, community_id, title, body, created_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userId, communityId, post.title, post.body, post.created_at],
      );
      postIds.set(post.id, Number(result.rows[0].id));
      importedPosts += 1;
    }

    for (const comment of comments) {
      await client.query(
        `INSERT INTO comments (post_id, user_id, body, created_at) VALUES ($1, $2, $3, $4)`,
        [
          requiredId(postIds.get(comment.post_id), "post", comment.post_id),
          requiredId(userIds.get(comment.user_id), "user", comment.user_id),
          comment.body,
          comment.created_at,
        ],
      );
    }
    for (const vote of votes) {
      await client.query(
        `INSERT INTO votes (user_id, post_id, created_at) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, post_id) DO NOTHING`,
        [
          requiredId(userIds.get(vote.user_id), "user", vote.user_id),
          requiredId(postIds.get(vote.post_id), "post", vote.post_id),
          vote.created_at,
        ],
      );
    }

    await client.query("COMMIT");
    console.log(
      `Imported ${users.length} accounts, ${importedPosts} threads, ${comments.length} replies, and ${votes.length} votes.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await getDb().end();
    source.close();
  }
}

main().catch((error: unknown) => {
  console.error("SQLite to Neon migration failed:", error);
  process.exitCode = 1;
});
