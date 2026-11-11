import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteThread } from "@/components/delete-thread";
import { EditThread } from "@/components/edit-thread";
import { FormError } from "@/components/form-error";
import { ReplyTree } from "@/components/reply-tree";
import { SubmitButton } from "@/components/submit-button";
import { VoteButton } from "@/components/vote-button";
import { reply } from "@/lib/actions";
import { errorMessage } from "@/lib/constants";
import { getPost, listReplies } from "@/lib/db";
import { formatTime, plural } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();
  const post = user ? await getPost(Number(id), user.id) : null;
  return { title: post?.title ?? "Thread" };
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    e?: string;
    threadError?: string;
    replyError?: string;
    replyId?: string;
    replyTo?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const post = await getPost(id, user.id);
  if (!post) notFound();
  const replies = await listReplies(id, user.id);
  const { e, threadError, replyError, replyId: errorReplyId, replyTo } = await searchParams;

  return (
    <article>
      <p className="text-sm text-mute">
        <Link href={`/c/${post.community_slug}`} className="hover:text-ink">
          {post.community_name}
        </Link>
      </p>
      <div className="mt-3 flex gap-3">
        <VoteButton postId={post.id} score={post.score} voted={post.voted} />
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-3xl leading-tight tracking-tight">{post.title}</h1>
          <p className="mt-2 text-sm text-mute">
            <Link href={`/u/${post.author_id}`} className="hover:text-ink">
              {post.author_name}
            </Link>
            <span> · {post.author_city} · </span>
            <time dateTime={new Date(post.created_at).toISOString()}>{formatTime(post.created_at)}</time>
          </p>
          {post.body ? (
            <div className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{post.body}</div>
          ) : null}
          {post.author_id === user.id ? (
            <div className="mt-4">
              <EditThread
                postId={post.id}
                title={post.title}
                body={post.body}
                error={errorMessage(threadError)}
              />
              <DeleteThread postId={post.id} />
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-xl tracking-tight">{plural(replies.length, "reply", "replies")}</h2>
        <form action={reply} className="mt-4 space-y-3">
          {replyTo === undefined ? <FormError message={errorMessage(e)} /> : null}
          <input type="hidden" name="postId" value={post.id} />
          <textarea
            name="body"
            required
            rows={4}
            maxLength={4000}
            placeholder="Add something useful…"
            className="field resize-y"
          />
          <SubmitButton className="btn" pendingLabel="Sending…">
            Reply
          </SubmitButton>
        </form>
        <ReplyTree
          postId={post.id}
          replies={replies}
          userId={user.id}
          error={replyTo !== undefined ? errorMessage(e) : undefined}
          replyTo={replyTo ? Number(replyTo) : undefined}
          editReplyId={errorReplyId}
          editError={errorMessage(replyError)}
        />
      </section>
    </article>
  );
}
