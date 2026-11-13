import { randomBytes } from "crypto";
import {
  neon,
  Pool,
  type NeonQueryFunction,
  type QueryResultRow,
} from "@neondatabase/serverless";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { hashSync } from "bcryptjs";
import { CIRCLES, HOST_EMAIL } from "./constants";

export type PublicUser = {
  id: number;
  email: string;
  name: string;
  practice: string;
  city: string;
  created_at: number;
};

export type SessionUser = PublicUser & {
  welcome_read_at: number | null;
  session_version: number;
};

export type Community = {
  id: number;
  slug: string;
  name: string;
  description: string;
};

export type CommunitySummary = Omit<Community, "id">;

export type PostCard = {
  id: number;
  title: string;
  body: string;
  created_at: number;
  author_id: number;
  author_name: string;
  author_city: string;
  author_deleted: boolean;
  community_name: string;
  community_slug: string;
  comment_count: number;
  score: number;
  upvotes_count: number;
  downvotes_count: number;
  voted: -1 | 0 | 1;
};

export type Reply = {
  id: number;
  post_id: number;
  parent_id: number | null;
  user_id: number;
  body: string;
  created_at: number;
  author_name: string;
  author_city: string;
  author_deleted: boolean;
  score: number;
  upvotes_count: number;
  downvotes_count: number;
  voted: -1 | 0 | 1;
};

export type AdminMember = PublicUser & {
  thread_count: number;
  reply_count: number;
};

export type QuizQuestionInput = {
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
  sourceTitle: string;
  sourceUrl: string;
};

export type QuizSummary = {
  id: number;
  title: string;
  learning_objective: string;
  opens_at: number;
  closes_at: number;
  question_count: number;
  submission_count: number;
};

export type MemberQuizSummary = Omit<QuizSummary, "submission_count"> & {
  has_submitted: boolean;
  score: number | null;
};

export type QuizMemberQuestion = {
  id: number;
  prompt: string;
  options: string[];
  explanation: string;
  source_title: string;
  source_url: string;
  correct_option: number | null;
  selected_option: number | null;
};

export type MemberQuiz = Omit<QuizSummary, "question_count" | "submission_count"> & {
  score: number | null;
  submitted_at: number | null;
  questions: QuizMemberQuestion[];
};

type UserRow = QueryResultRow & SessionUser & { password_hash: string };

type PostRow = QueryResultRow & {
  id: number | string;
  title: string;
  body: string;
  created_at: number | string;
  author_id: number | string;
  author_name: string;
  author_city: string;
  author_deleted: boolean;
  community_name: string;
  community_slug: string;
  comment_count: number | string;
  score: number | string;
  upvotes_count: number | string;
  downvotes_count: number | string;
  voted: number | string;
};

type ReplyRow = QueryResultRow & {
  id: number | string;
  post_id: number | string;
  parent_id: number | string | null;
  user_id: number | string;
  author_deleted: boolean;
  body: string;
  created_at: number | string;
  author_name: string;
  author_city: string;
  score: number | string;
  upvotes_count: number | string;
  downvotes_count: number | string;
  voted: number | string;
};

type DbGlobal = typeof globalThis & {
  marketingTribePool?: Pool;
  marketingTribeHttp?: NeonQueryFunction<false, true>;
  marketingTribeSchema?: Promise<void>;
};

const globalForDb = globalThis as DbGlobal;

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Configure a Neon PostgreSQL connection string.");
  }
  return connectionString;
}

export function getDb() {
  if (!globalForDb.marketingTribePool) {
    globalForDb.marketingTribePool = new Pool({ connectionString: getConnectionString(), max: 5 });
  }
  return globalForDb.marketingTribePool;
}

function getHttpDb() {
  if (!globalForDb.marketingTribeHttp) {
    globalForDb.marketingTribeHttp = neon(getConnectionString(), { fullResults: true });
  }
  return globalForDb.marketingTribeHttp;
}

const WELCOME_TITLE = "Read this once, then start a real thread";

const WELCOME_BODY = `Welcome in.

This room is for marketers in India — agency, in-house, freelance, or founder. Performance, brand, content, growth, and the unglamorous middle of the work.

A few habits that keep it useful:
- Say what you tried, not only what you think.
- Specifics beat slogans. Budgets, channels, cities, and constraints help.
- Be decent to people who are still learning something you already learned.
- Skip the pitch unless someone asked for it.

You needed an account to get here. So does everyone else. Start a thread when something real is on your mind.`;

async function initializeSchema() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      practice TEXT NOT NULL,
      city TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      welcome_read_at BIGINT,
      session_version BIGINT NOT NULL DEFAULT 0
    )
  `);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_read_at BIGINT`);
  await db.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version BIGINT NOT NULL DEFAULT 0`,
  );
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at BIGINT`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at BIGINT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_rate_limits (
      key_hash TEXT PRIMARY KEY,
      window_started_at BIGINT NOT NULL,
      attempts INTEGER NOT NULL
    )
  `);
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id)`,
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_password_reset_rate_limits_window ON password_reset_rate_limits(window_started_at)`,
  );
  await db.query(`
    CREATE TABLE IF NOT EXISTS communities (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id),
      community_id BIGINT NOT NULL REFERENCES communities(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      parent_id BIGINT REFERENCES comments(id) ON DELETE SET NULL,
      user_id BIGINT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `);
  await db.query(
    `ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES comments(id) ON DELETE SET NULL`,
  );
  await db.query(`
    CREATE TABLE IF NOT EXISTS votes (
      user_id BIGINT NOT NULL REFERENCES users(id),
      post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      vote_value SMALLINT NOT NULL DEFAULT 1 CHECK (vote_value IN (-1, 1)),
      created_at BIGINT NOT NULL,
      PRIMARY KEY (user_id, post_id)
    )
  `);
  await db.query(`ALTER TABLE votes ADD COLUMN IF NOT EXISTS vote_value SMALLINT NOT NULL DEFAULT 1`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS reply_votes (
      user_id BIGINT NOT NULL REFERENCES users(id),
      comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      vote_value SMALLINT NOT NULL CHECK (vote_value IN (-1, 1)),
      created_at BIGINT NOT NULL,
      PRIMARY KEY (user_id, comment_id)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      title TEXT NOT NULL,
      learning_objective TEXT NOT NULL,
      opens_at BIGINT NOT NULL,
      closes_at BIGINT NOT NULL,
      created_at BIGINT NOT NULL,
      CHECK (closes_at > opens_at)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      position INTEGER NOT NULL CHECK (position >= 0),
      prompt TEXT NOT NULL,
      options JSONB NOT NULL
        CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4),
      correct_option SMALLINT NOT NULL CHECK (correct_option BETWEEN 0 AND 3),
      explanation TEXT NOT NULL,
      source_title TEXT NOT NULL,
      source_url TEXT NOT NULL,
      UNIQUE (quiz_id, position)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS quiz_submissions (
      quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      answers JSONB NOT NULL CHECK (jsonb_typeof(answers) = 'object'),
      score INTEGER NOT NULL CHECK (score >= 0),
      submitted_at BIGINT NOT NULL,
      PRIMARY KEY (quiz_id, user_id)
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)`);
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id, created_at DESC)`,
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at)`,
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id, created_at)`,
  );
  await db.query(`CREATE INDEX IF NOT EXISTS idx_votes_post ON votes(post_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_reply_votes_comment ON reply_votes(comment_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_quizzes_schedule ON quizzes(opens_at DESC)`);
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions(quiz_id, position)`,
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user ON quiz_submissions(user_id, submitted_at DESC)`,
  );

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [827361045]);

    for (const [slug, name, description, sortOrder] of CIRCLES) {
      await client.query(
        `INSERT INTO communities (slug, name, description, sort_order)
         VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING`,
        [slug, name, description, sortOrder],
      );
    }

    const host = await client.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, practice, city, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET
         name = CASE WHEN users.name = 'Adda' THEN EXCLUDED.name ELSE users.name END
       RETURNING id`,
      [
        HOST_EMAIL,
        hashSync(randomBytes(24).toString("hex"), 10),
        "MarketingTribe",
        "Host",
        "India",
        Date.now(),
      ],
    );
    const welcomeMigration = await client.query(
      `SELECT value FROM meta WHERE key = 'welcome_read_migrated' FOR UPDATE`,
    );
    if (welcomeMigration.rowCount === 0) {
      await client.query(
        `UPDATE users SET welcome_read_at = created_at WHERE welcome_read_at IS NULL`,
      );
      await client.query(
        `INSERT INTO meta (key, value) VALUES ('welcome_read_migrated', '1')`,
      );
    }
    const seeded = await client.query(`SELECT value FROM meta WHERE key = 'seeded' FOR UPDATE`);
    if (seeded.rowCount === 0) {
      await client.query(
        `INSERT INTO posts (user_id, community_id, title, body, created_at)
         SELECT $1, id, $2, $3, $4 FROM communities WHERE slug = 'general'`,
        [host.rows[0].id, WELCOME_TITLE, WELCOME_BODY, Date.now()],
      );
      await client.query(`INSERT INTO meta (key, value) VALUES ('seeded', '1')`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function databaseIsInitialized() {
  const db = getHttpDb();
  const schema = await db.query(`
    SELECT
      to_regclass('public.meta') IS NOT NULL AS meta,
      to_regclass('public.users') IS NOT NULL AS users,
      to_regclass('public.communities') IS NOT NULL AS communities,
      to_regclass('public.posts') IS NOT NULL AS posts,
      to_regclass('public.comments') IS NOT NULL AS comments,
      to_regclass('public.votes') IS NOT NULL AS votes,
      to_regclass('public.reply_votes') IS NOT NULL AS reply_votes,
      to_regclass('public.idx_posts_created') IS NOT NULL AS posts_created_index,
      to_regclass('public.idx_posts_community') IS NOT NULL AS posts_community_index,
      to_regclass('public.idx_comments_post') IS NOT NULL AS comments_post_index,
      to_regclass('public.idx_comments_parent') IS NOT NULL AS comments_parent_index,
      to_regclass('public.idx_votes_post') IS NOT NULL AS votes_post_index,
      to_regclass('public.idx_reply_votes_comment') IS NOT NULL AS reply_votes_comment_index,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'welcome_read_at'
      ) AS welcome_read_at,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'comments'
          AND column_name = 'parent_id'
      ) AS comments_parent_id,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'votes'
          AND column_name = 'vote_value'
      ) AS votes_value,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'session_version'
      ) AS session_version,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'deleted_at'
      ) AS users_deleted_at,
      to_regclass('public.password_reset_tokens') IS NOT NULL AS password_reset_tokens,
      to_regclass('public.password_reset_rate_limits') IS NOT NULL AS password_reset_rate_limits,
      to_regclass('public.idx_password_reset_tokens_user') IS NOT NULL AS reset_tokens_user_index,
      to_regclass('public.idx_password_reset_rate_limits_window') IS NOT NULL AS reset_rate_limits_window_index,
      to_regclass('public.quizzes') IS NOT NULL AS quizzes,
      to_regclass('public.quiz_questions') IS NOT NULL AS quiz_questions,
      to_regclass('public.quiz_submissions') IS NOT NULL AS quiz_submissions,
      to_regclass('public.idx_quizzes_schedule') IS NOT NULL AS quizzes_schedule_index,
      to_regclass('public.idx_quiz_questions_order') IS NOT NULL AS quiz_questions_order_index,
      to_regclass('public.idx_quiz_submissions_user') IS NOT NULL AS quiz_submissions_user_index
  `);
  if (!Object.values(schema.rows[0]).every(Boolean)) return false;

  const setup = await db.query(`
    SELECT
      EXISTS (SELECT 1 FROM meta WHERE key = 'seeded') AS seeded,
      EXISTS (SELECT 1 FROM meta WHERE key = 'welcome_read_migrated') AS welcome_read_migrated
  `);
  return setup.rows[0].seeded && setup.rows[0].welcome_read_migrated;
}

export async function ensureDatabase() {
  if (!globalForDb.marketingTribeSchema) {
    globalForDb.marketingTribeSchema = databaseIsInitialized()
      .then((initialized) => (initialized ? undefined : initializeSchema()))
      .catch((error: unknown) => {
        globalForDb.marketingTribeSchema = undefined;
        throw error;
      });
  }
  await globalForDb.marketingTribeSchema;
}

async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  await ensureDatabase();
  const result = await getHttpDb().query(text, values);
  return { ...result, rows: result.rows as T[] };
}

function toPublicUser(row: UserRow): SessionUser {
  return {
    id: Number(row.id),
    email: String(row.email),
    name: String(row.name),
    practice: String(row.practice),
    city: String(row.city),
    created_at: Number(row.created_at),
    welcome_read_at: row.welcome_read_at === null ? null : Number(row.welcome_read_at),
    session_version: Number(row.session_version),
  };
}

export async function getUserById(id: number): Promise<SessionUser | null> {
  const result = await query<UserRow>(
    `SELECT id, email, password_hash, name, practice, city, created_at, welcome_read_at, session_version
     FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ? toPublicUser(result.rows[0]) : null;
}

export async function getUserByEmail(
  email: string,
): Promise<(SessionUser & { password_hash: string }) | null> {
  const result = await query<UserRow>(
    `SELECT id, email, password_hash, name, practice, city, created_at, welcome_read_at, session_version
     FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email],
  );
  const row = result.rows[0];
  return row ? { ...toPublicUser(row), password_hash: String(row.password_hash) } : null;
}

export async function getPasswordHashForUser(userId: number) {
  const result = await query<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId],
  );
  return result.rows[0] ? String(result.rows[0].password_hash) : null;
}

export async function anonymizeUserAccount(
  userId: number,
  expectedPasswordHash: string,
  replacementPasswordHash: string,
  replacementEmail: string,
  deletedAt: number,
) {
  await ensureDatabase();
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const user = await client.query(
      `SELECT id FROM users
       WHERE id = $1 AND password_hash = $2 AND email != $3 AND deleted_at IS NULL
       FOR UPDATE`,
      [userId, expectedPasswordHash, HOST_EMAIL],
    );
    if (user.rowCount !== 1) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query(
      `UPDATE users
       SET email = $1, password_hash = $2, name = 'Deleted member',
           practice = '', city = '', deleted_at = $3,
           session_version = session_version + 1
       WHERE id = $4`,
      [replacementEmail, replacementPasswordHash, deletedAt, userId],
    );
    await client.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM votes WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM reply_votes WHERE user_id = $1`, [userId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function emailTaken(email: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM users WHERE email = $1`,
    [email],
  );
  return result.rowCount !== 0;
}

export async function getPasswordResetRecipient(email: string) {
  const result = await query<{ id: number | string; name: string }>(
    `SELECT id, name FROM users WHERE email = $1 AND email != $2 AND deleted_at IS NULL`,
    [email, HOST_EMAIL],
  );
  const row = result.rows[0];
  return row ? { id: Number(row.id), name: String(row.name) } : null;
}

export async function createPasswordResetToken(
  userId: number,
  tokenHash: string,
  createdAt: number,
  expiresAt: number,
) {
  await ensureDatabase();
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const user = await client.query(`SELECT id FROM users WHERE id = $1 FOR UPDATE`, [userId]);
    if (user.rowCount !== 1) throw new Error("Password reset account no longer exists.");
    await client.query(`DELETE FROM password_reset_tokens WHERE expires_at <= $1`, [createdAt]);
    await client.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);
    await client.query(
      `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, created_at)
       VALUES ($1, $2, $3, $4)`,
      [tokenHash, userId, expiresAt, createdAt],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePasswordResetToken(tokenHash: string) {
  await query(`DELETE FROM password_reset_tokens WHERE token_hash = $1`, [tokenHash]);
}

export async function isPasswordResetTokenValid(tokenHash: string, now: number) {
  const result = await query(
    `SELECT 1 FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > $2`,
    [tokenHash, now],
  );
  return result.rowCount !== 0;
}

export async function consumePasswordResetRateLimit(
  keyHash: string,
  now: number,
  windowMs: number,
  maxAttempts: number,
) {
  const windowStartedAt = now - windowMs;
  const result = await query<{ attempts: number | string }>(
    `INSERT INTO password_reset_rate_limits (key_hash, window_started_at, attempts)
     VALUES ($1, $2, 1)
     ON CONFLICT (key_hash) DO UPDATE SET
       attempts = CASE
         WHEN password_reset_rate_limits.window_started_at <= $3 THEN 1
         ELSE password_reset_rate_limits.attempts + 1
       END,
       window_started_at = CASE
         WHEN password_reset_rate_limits.window_started_at <= $3 THEN $2
         ELSE password_reset_rate_limits.window_started_at
       END
     RETURNING attempts`,
    [keyHash, now, windowStartedAt],
  );
  await query(`DELETE FROM password_reset_rate_limits WHERE window_started_at <= $1`, [
    now - 24 * 60 * 60 * 1000,
  ]);
  return Number(result.rows[0].attempts) <= maxAttempts;
}

export async function consumePasswordResetToken(
  tokenHash: string,
  passwordHash: string,
  now: number,
) {
  await ensureDatabase();
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const token = await client.query<{ user_id: string }>(
      `DELETE FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > $2
       RETURNING user_id`,
      [tokenHash, now],
    );
    if (!token.rows[0]) {
      await client.query("COMMIT");
      return false;
    }

    const userId = token.rows[0].user_id;
    const updated = await client.query(
      `UPDATE users
       SET password_hash = $1, session_version = session_version + 1
       WHERE id = $2`,
      [passwordHash, userId],
    );
    if (updated.rowCount !== 1) throw new Error("Password reset account no longer exists.");

    await client.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  name: string;
  practice: string;
  city: string;
}) {
  const result = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash, name, practice, city, created_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [input.email, input.passwordHash, input.name, input.practice, input.city, Date.now()],
  );
  return Number(result.rows[0].id);
}

export async function updateUser(
  id: number,
  input: { name: string; practice: string; city: string },
) {
  await query(
    `UPDATE users SET name = $1, practice = $2, city = $3 WHERE id = $4`,
    [input.name, input.practice, input.city, id],
  );
}

export async function markWelcomeRead(userId: number) {
  await query(
    `UPDATE users SET welcome_read_at = $1
     WHERE id = $2 AND welcome_read_at IS NULL`,
    [Date.now(), userId],
  );
}

export function listCommunities(): CommunitySummary[] {
  return CIRCLES.map(([slug, name, description]) => ({ slug, name, description }));
}

export const getCommunity = cache(
  async function getCommunity(slug: string): Promise<Community | null> {
    const result = await query<Community>(
      `SELECT id, slug, name, description FROM communities WHERE slug = $1`,
      [slug],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: Number(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: String(row.description),
    };
  },
);

function mapPost(row: PostRow): PostCard {
  return {
    id: Number(row.id),
    title: String(row.title),
    body: String(row.body),
    created_at: Number(row.created_at),
    author_id: Number(row.author_id),
    author_name: String(row.author_name),
    author_city: String(row.author_city),
    author_deleted: row.author_deleted,
    community_name: String(row.community_name),
    community_slug: String(row.community_slug),
    comment_count: Number(row.comment_count),
    score: Number(row.score),
    upvotes_count: Number(row.upvotes_count),
    downvotes_count: Number(row.downvotes_count),
    voted: Number(row.voted) as -1 | 0 | 1,
  };
}

const POST_SELECT = `
  SELECT
    p.id,
    p.title,
    p.body,
    p.created_at,
    u.id AS author_id,
    u.name AS author_name,
    u.city AS author_city,
    u.deleted_at IS NOT NULL AS author_deleted,
    c.name AS community_name,
    c.slug AS community_slug,
    (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count,
    (SELECT GREATEST(COALESCE(SUM(v.vote_value), 0), 0) FROM votes v WHERE v.post_id = p.id) AS score,
    (SELECT COUNT(*) FROM votes v WHERE v.post_id = p.id AND v.vote_value = 1) AS upvotes_count,
    (SELECT COUNT(*) FROM votes v WHERE v.post_id = p.id AND v.vote_value = -1) AS downvotes_count,
    COALESCE((SELECT v.vote_value FROM votes v WHERE v.post_id = p.id AND v.user_id = $1), 0) AS voted
  FROM posts p
  JOIN users u ON u.id = p.user_id
  JOIN communities c ON c.id = p.community_id
`;

export async function listPosts(options: {
  viewerId: number;
  communitySlug?: string;
  authorId?: number;
  sort?: "new" | "top";
  query?: string;
}): Promise<PostCard[]> {
  const where: string[] = [];
  const params: Array<string | number> = [options.viewerId];
  const bind = (value: string | number) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (options.communitySlug) where.push(`c.slug = ${bind(options.communitySlug)}`);
  if (options.authorId) where.push(`p.user_id = ${bind(options.authorId)}`);
  if (options.query) {
    const escaped = options.query.replace(/[\\%_]/g, (char) => `\\${char}`);
    const term = bind(`%${escaped}%`);
    where.push(`(p.title ILIKE ${term} ESCAPE E'\\\\' OR p.body ILIKE ${term} ESCAPE E'\\\\')`);
  }

  const order = options.sort === "top" ? "score DESC, p.created_at DESC" : "p.created_at DESC";
  const sql = `${POST_SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order} LIMIT 80`;
  const result = await query<PostRow>(sql, params);
  return result.rows.map(mapPost);
}

export async function getPost(id: number, viewerId: number): Promise<PostCard | null> {
  const result = await query<PostRow>(`${POST_SELECT} WHERE p.id = $2`, [viewerId, id]);
  return result.rows[0] ? mapPost(result.rows[0]) : null;
}

export async function getWelcomePost(viewerId: number): Promise<PostCard | null> {
  const result = await query<PostRow>(
    `${POST_SELECT} WHERE p.title = $2 ORDER BY p.created_at ASC LIMIT 1`,
    [viewerId, WELCOME_TITLE],
  );
  return result.rows[0] ? mapPost(result.rows[0]) : null;
}

export async function createPost(input: {
  userId: number;
  communitySlug: string;
  title: string;
  body: string;
}) {
  const result = await query<{ id: string }>(
    `INSERT INTO posts (user_id, community_id, title, body, created_at)
     SELECT $1, id, $3, $4, $5 FROM communities WHERE slug = $2
     RETURNING id`,
    [input.userId, input.communitySlug, input.title, input.body, Date.now()],
  );
  return result.rows[0] ? Number(result.rows[0].id) : null;
}

export async function updatePost(id: number, userId: number, title: string, body: string) {
  const result = await query(
    `UPDATE posts SET title = $1, body = $2 WHERE id = $3 AND user_id = $4`,
    [title, body, id, userId],
  );
  return result.rowCount !== 0;
}

export async function deletePost(id: number, userId: number) {
  const result = await query(`DELETE FROM posts WHERE id = $1 AND user_id = $2`, [id, userId]);
  return result.rowCount !== 0;
}

export async function setPostVote(postId: number, userId: number, voteValue: -1 | 0 | 1) {
  if (voteValue === 0) {
    await query(`DELETE FROM votes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
  } else {
    await query(
      `INSERT INTO votes (user_id, post_id, vote_value, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, post_id) DO UPDATE
       SET vote_value = EXCLUDED.vote_value, created_at = EXCLUDED.created_at`,
      [userId, postId, voteValue, Date.now()],
    );
  }
}

export async function getPostVote(postId: number, userId: number) {
  const result = await query<{
    score: number | string;
    upvotes_count: number | string;
    downvotes_count: number | string;
    voted: number | string;
  }>(
    `SELECT
       GREATEST(COALESCE(SUM(vote_value), 0), 0) AS score,
       COUNT(*) FILTER (WHERE vote_value = 1) AS upvotes_count,
       COUNT(*) FILTER (WHERE vote_value = -1) AS downvotes_count,
       COALESCE(MAX(vote_value) FILTER (WHERE user_id = $2), 0) AS voted
     FROM votes WHERE post_id = $1`,
    [postId, userId],
  );
  return {
    score: Number(result.rows[0].score),
    upvotes_count: Number(result.rows[0].upvotes_count),
    downvotes_count: Number(result.rows[0].downvotes_count),
    voted: Number(result.rows[0].voted) as -1 | 0 | 1,
  };
}

export async function listReplies(postId: number, viewerId: number): Promise<Reply[]> {
  const result = await query<ReplyRow>(
    `SELECT cm.id, cm.post_id, cm.parent_id, cm.user_id, cm.body, cm.created_at,
            u.name AS author_name, u.city AS author_city,
            u.deleted_at IS NOT NULL AS author_deleted,
            (SELECT GREATEST(COALESCE(SUM(rv.vote_value), 0), 0)
             FROM reply_votes rv WHERE rv.comment_id = cm.id) AS score,
            (SELECT COUNT(*) FROM reply_votes rv
             WHERE rv.comment_id = cm.id AND rv.vote_value = 1) AS upvotes_count,
            (SELECT COUNT(*) FROM reply_votes rv
             WHERE rv.comment_id = cm.id AND rv.vote_value = -1) AS downvotes_count,
            COALESCE((SELECT rv.vote_value FROM reply_votes rv
                      WHERE rv.comment_id = cm.id AND rv.user_id = $2), 0) AS voted
     FROM comments cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.post_id = $1
     ORDER BY cm.created_at ASC, cm.id ASC`,
    [postId, viewerId],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    post_id: Number(row.post_id),
    parent_id: row.parent_id === null ? null : Number(row.parent_id),
    user_id: Number(row.user_id),
    author_deleted: row.author_deleted,
    body: String(row.body),
    created_at: Number(row.created_at),
    author_name: String(row.author_name),
    author_city: String(row.author_city),
    score: Number(row.score),
    upvotes_count: Number(row.upvotes_count),
    downvotes_count: Number(row.downvotes_count),
    voted: Number(row.voted) as -1 | 0 | 1,
  }));
}

export async function createReply(
  postId: number,
  userId: number,
  body: string,
  parentId: number | null,
) {
  const result = await query(
    `INSERT INTO comments (post_id, user_id, body, created_at, parent_id)
     SELECT $1, $2, $3, $4, $5::BIGINT
     WHERE EXISTS (SELECT 1 FROM posts WHERE id = $1)
       AND ($5::BIGINT IS NULL OR EXISTS (
         SELECT 1 FROM comments WHERE id = $5::BIGINT AND post_id = $1
       ))
     RETURNING id`,
    [postId, userId, body, Date.now(), parentId],
  );
  return result.rowCount !== 0;
}

export async function setReplyVote(commentId: number, userId: number, voteValue: -1 | 0 | 1) {
  if (voteValue === 0) {
    await query(`DELETE FROM reply_votes WHERE comment_id = $1 AND user_id = $2`, [commentId, userId]);
  } else {
    await query(
      `INSERT INTO reply_votes (comment_id, user_id, vote_value, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, comment_id) DO UPDATE
       SET vote_value = EXCLUDED.vote_value, created_at = EXCLUDED.created_at`,
      [commentId, userId, voteValue, Date.now()],
    );
  }
}

export async function getReplyVote(commentId: number, userId: number) {
  const result = await query<{
    score: number | string;
    upvotes_count: number | string;
    downvotes_count: number | string;
    voted: number | string;
  }>(
    `SELECT
       GREATEST(COALESCE(SUM(vote_value), 0), 0) AS score,
       COUNT(*) FILTER (WHERE vote_value = 1) AS upvotes_count,
       COUNT(*) FILTER (WHERE vote_value = -1) AS downvotes_count,
       COALESCE(MAX(vote_value) FILTER (WHERE user_id = $2), 0) AS voted
     FROM reply_votes WHERE comment_id = $1`,
    [commentId, userId],
  );
  return {
    score: Number(result.rows[0].score),
    upvotes_count: Number(result.rows[0].upvotes_count),
    downvotes_count: Number(result.rows[0].downvotes_count),
    voted: Number(result.rows[0].voted) as -1 | 0 | 1,
  };
}

export async function updateReply(id: number, postId: number, userId: number, body: string) {
  const result = await query(
    `UPDATE comments SET body = $1 WHERE id = $2 AND post_id = $3 AND user_id = $4`,
    [body, id, postId, userId],
  );
  return result.rowCount !== 0;
}

export async function deleteReply(id: number, userId: number) {
  const result = await query(`DELETE FROM comments WHERE id = $1 AND user_id = $2`, [id, userId]);
  return result.rowCount !== 0;
}

export async function listMembers(): Promise<Array<Omit<PublicUser, "email">>> {
  const result = await query<PublicUser>(
    `SELECT id, name, practice, city, created_at
     FROM users WHERE email != $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
    [HOST_EMAIL],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    practice: String(row.practice),
    city: String(row.city),
    created_at: Number(row.created_at),
  }));
}

export async function listAdminMembers(): Promise<AdminMember[]> {
  const result = await query<AdminMember>(
    `SELECT
       u.id, u.email, u.name, u.practice, u.city, u.created_at,
       (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS thread_count,
       (SELECT COUNT(*) FROM comments cm WHERE cm.user_id = u.id) AS reply_count
     FROM users u
     WHERE u.email != $1 AND u.deleted_at IS NULL
     ORDER BY u.created_at DESC`,
    [HOST_EMAIL],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    email: String(row.email),
    name: String(row.name),
    practice: String(row.practice),
    city: String(row.city),
    created_at: Number(row.created_at),
    thread_count: Number(row.thread_count),
    reply_count: Number(row.reply_count),
  }));
}

export const getStats = unstable_cache(
  async function getStats() {
    const result = await query<{ members: string; threads: string }>(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE email != $1 AND deleted_at IS NULL) AS members,
         (SELECT COUNT(*) FROM posts) AS threads`,
      [HOST_EMAIL],
    );
    return {
      members: Number(result.rows[0].members),
      threads: Number(result.rows[0].threads),
    };
  },
  ["marketing-tribe-stats"],
  { revalidate: 60 },
);

function parseQuizOptions(value: unknown): string[] {
  const parsed: unknown = typeof value === "string" ? JSON.parse(value) : value;
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 4 ||
    !parsed.every((item) => typeof item === "string")
  ) {
    throw new Error("Quiz options are invalid in the database.");
  }
  return parsed;
}

export async function createQuiz(input: {
  title: string;
  learningObjective: string;
  opensAt: number;
  closesAt: number;
  createdAt: number;
  questions: QuizQuestionInput[];
}) {
  await ensureDatabase();
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const quiz = await client.query<{ id: string }>(
      `INSERT INTO quizzes (title, learning_objective, opens_at, closes_at, created_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [input.title, input.learningObjective, input.opensAt, input.closesAt, input.createdAt],
    );
    const quizId = Number(quiz.rows[0].id);
    for (const [position, question] of input.questions.entries()) {
      await client.query(
        `INSERT INTO quiz_questions
           (quiz_id, position, prompt, options, correct_option, explanation, source_title, source_url)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)`,
        [
          quizId,
          position,
          question.prompt,
          JSON.stringify(question.options),
          question.correctOption,
          question.explanation,
          question.sourceTitle,
          question.sourceUrl,
        ],
      );
    }
    await client.query("COMMIT");
    return quizId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listQuizzesForAdmin(): Promise<QuizSummary[]> {
  const result = await query<QuizSummary>(
    `SELECT q.id, q.title, q.learning_objective, q.opens_at, q.closes_at,
            COUNT(DISTINCT qq.id) AS question_count,
            COUNT(DISTINCT qs.user_id) AS submission_count
     FROM quizzes q
     LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
     LEFT JOIN quiz_submissions qs ON qs.quiz_id = q.id
     GROUP BY q.id
     ORDER BY q.opens_at DESC
     LIMIT 100`,
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    learning_objective: String(row.learning_objective),
    opens_at: Number(row.opens_at),
    closes_at: Number(row.closes_at),
    question_count: Number(row.question_count),
    submission_count: Number(row.submission_count),
  }));
}

export async function listQuizzesForMember(userId: number): Promise<MemberQuizSummary[]> {
  const result = await query<MemberQuizSummary>(
    `SELECT q.id, q.title, q.learning_objective, q.opens_at, q.closes_at,
            COUNT(qq.id) AS question_count,
            (qs.user_id IS NOT NULL) AS has_submitted,
            qs.score
     FROM quizzes q
     LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
     LEFT JOIN quiz_submissions qs ON qs.quiz_id = q.id AND qs.user_id = $1
     GROUP BY q.id, qs.user_id, qs.score
     ORDER BY q.opens_at DESC
     LIMIT 100`,
    [userId],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    learning_objective: String(row.learning_objective),
    opens_at: Number(row.opens_at),
    closes_at: Number(row.closes_at),
    question_count: Number(row.question_count),
    has_submitted: row.has_submitted,
    score: row.score === null ? null : Number(row.score),
  }));
}

export async function getFeaturedQuizForMember(
  userId: number,
  now: number,
): Promise<MemberQuizSummary | null> {
  const result = await query<MemberQuizSummary>(
    `SELECT q.id, q.title, q.learning_objective, q.opens_at, q.closes_at,
            COUNT(qq.id) AS question_count,
            (qs.user_id IS NOT NULL) AS has_submitted,
            qs.score
     FROM quizzes q
     LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
     LEFT JOIN quiz_submissions qs ON qs.quiz_id = q.id AND qs.user_id = $1
     WHERE q.closes_at > $2 OR qs.user_id IS NOT NULL
     GROUP BY q.id, qs.user_id, qs.score
     ORDER BY
       CASE
         WHEN q.opens_at <= $2 AND q.closes_at > $2 AND qs.user_id IS NULL THEN 0
         WHEN q.opens_at > $2 THEN 1
         WHEN q.opens_at <= $2 AND q.closes_at > $2 THEN 2
         ELSE 3
       END,
       CASE WHEN q.opens_at > $2 THEN q.opens_at END ASC,
       q.opens_at DESC
     LIMIT 1`,
    [userId, now],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: Number(row.id),
    title: String(row.title),
    learning_objective: String(row.learning_objective),
    opens_at: Number(row.opens_at),
    closes_at: Number(row.closes_at),
    question_count: Number(row.question_count),
    has_submitted: row.has_submitted,
    score: row.score === null ? null : Number(row.score),
  };
}

export async function getQuizForMember(quizId: number, userId: number): Promise<MemberQuiz | null> {
  const result = await query<{
    id: number | string;
    title: string;
    learning_objective: string;
    opens_at: number | string;
    closes_at: number | string;
    score: number | string | null;
    submitted_at: number | string | null;
  }>(
    `SELECT q.id, q.title, q.learning_objective, q.opens_at, q.closes_at,
            qs.score, qs.submitted_at
     FROM quizzes q
     LEFT JOIN quiz_submissions qs ON qs.quiz_id = q.id AND qs.user_id = $2
     WHERE q.id = $1`,
    [quizId, userId],
  );
  const quiz = result.rows[0];
  if (!quiz) return null;

  const questions = await query<{
    id: number | string;
    prompt: string;
    options: unknown;
    explanation: string | null;
    gated_source_title: string | null;
    source_url: string | null;
    correct_option: number | string | null;
    selected_option: number | string | null;
  }>(
    `SELECT qq.id, qq.prompt, qq.options,
            CASE WHEN qs.user_id IS NULL THEN NULL ELSE qq.explanation END AS explanation,
            CASE WHEN qs.user_id IS NULL THEN NULL ELSE qq.source_title END AS gated_source_title,
            CASE WHEN qs.user_id IS NULL THEN NULL ELSE qq.source_url END AS source_url,
            CASE WHEN qs.user_id IS NULL THEN NULL ELSE qq.correct_option END AS correct_option,
            (qs.answers ->> qq.id::text)::INTEGER AS selected_option
     FROM quiz_questions qq
     LEFT JOIN quiz_submissions qs ON qs.quiz_id = qq.quiz_id AND qs.user_id = $2
     WHERE qq.quiz_id = $1
     ORDER BY qq.position`,
    [quizId, userId],
  );

  return {
    id: Number(quiz.id),
    title: quiz.title,
    learning_objective: quiz.learning_objective,
    opens_at: Number(quiz.opens_at),
    closes_at: Number(quiz.closes_at),
    score: quiz.score === null ? null : Number(quiz.score),
    submitted_at: quiz.submitted_at === null ? null : Number(quiz.submitted_at),
    questions: questions.rows.map((row) => ({
      id: Number(row.id),
      prompt: String(row.prompt),
      options: parseQuizOptions(row.options),
      explanation: row.explanation === null ? "" : row.explanation,
      source_title: row.gated_source_title === null ? "" : row.gated_source_title,
      source_url: row.source_url === null ? "" : row.source_url,
      correct_option: row.correct_option === null ? null : Number(row.correct_option),
      selected_option: row.selected_option === null ? null : Number(row.selected_option),
    })),
  };
}

export async function getQuizQuestionsForScoring(quizId: number) {
  const result = await query<{ id: string; correct_option: number }>(
    `SELECT id, correct_option FROM quiz_questions WHERE quiz_id = $1 ORDER BY position`,
    [quizId],
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    correctOption: Number(row.correct_option),
  }));
}

export async function saveQuizSubmission(
  quizId: number,
  userId: number,
  answers: Record<string, number>,
  submittedAt: number,
) {
  const result = await query(
    `INSERT INTO quiz_submissions (quiz_id, user_id, answers, score, submitted_at)
     SELECT q.id, $2, $3::jsonb,
            (SELECT COUNT(*) FROM quiz_questions qq
             WHERE qq.quiz_id = q.id
               AND ($3::jsonb ->> qq.id::text)::INTEGER = qq.correct_option),
            $4
     FROM quizzes q
     WHERE q.id = $1
       AND q.opens_at <= $4
       AND q.closes_at > $4
       AND jsonb_object_length($3::jsonb) = (
         SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id
       )
     ON CONFLICT (quiz_id, user_id) DO NOTHING
     RETURNING score`,
    [quizId, userId, JSON.stringify(answers), submittedAt],
  );
  return result.rowCount !== 0;
}
