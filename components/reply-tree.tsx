import Link from "next/link";
import { reply } from "@/lib/actions";
import type { Reply } from "@/lib/db";
import { formatTime } from "@/lib/format";
import { DeleteReply } from "./delete-reply";
import { EditReply } from "./edit-reply";
import { FormError } from "./form-error";
import { SubmitButton } from "./submit-button";
import { VoteButton } from "./vote-button";

type ReplyNode = Reply & { children: ReplyNode[] };

const threadLines = ["border-sky-500", "border-emerald-500", "border-amber-500", "border-violet-500"];

function nestReplies(replies: Reply[]): ReplyNode[] {
  const nodes = new Map<number, ReplyNode>();
  const roots: ReplyNode[] = [];

  for (const item of replies) nodes.set(item.id, { ...item, children: [] });
  for (const node of nodes.values()) {
    const parent = node.parent_id === null ? undefined : nodes.get(node.parent_id);
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export function ReplyTree({
  postId,
  replies,
  userId,
  error,
  replyTo,
  editReplyId,
  editError,
}: {
  postId: number;
  replies: Reply[];
  userId: number;
  error?: string;
  replyTo?: number;
  editReplyId?: string;
  editError?: string;
}) {
  const renderNode = (node: ReplyNode, depth: number) => (
    <div
      key={node.id}
      className={depth > 0
        ? `ml-3 border-l-2 pl-4 sm:ml-5 ${threadLines[(depth - 1) % threadLines.length]}`
        : ""}
    >
      <div className="flex items-start gap-2">
        <VoteButton
          replyId={node.id}
          score={node.score}
          upvotes_count={node.upvotes_count}
          downvotes_count={node.downvotes_count}
          voted={node.voted}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-mute">
            {node.author_deleted ? (
              node.author_name
            ) : (
              <Link href={`/u/${node.user_id}`} className="hover:text-ink">
                {node.author_name}
              </Link>
            )}
            {node.author_city ? <span> · {node.author_city}</span> : null}
            <span> · </span>
            <time dateTime={new Date(node.created_at).toISOString()}>{formatTime(node.created_at)}</time>
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{node.body}</p>
          <details className="mt-2" open={replyTo === node.id || undefined}>
            <summary className="w-fit cursor-pointer text-xs text-mute hover:text-ink">Reply</summary>
            <form action={reply} className="mt-3 space-y-3">
              {replyTo === node.id ? <FormError message={error} /> : null}
              <input type="hidden" name="postId" value={postId} />
              <input type="hidden" name="parentReplyId" value={node.id} />
              <textarea
                name="body"
                required
                rows={3}
                maxLength={4000}
                placeholder={`Reply to ${node.author_name}…`}
                className="field resize-y"
              />
              <SubmitButton className="btn" pendingLabel="Sending…">
                Reply
              </SubmitButton>
            </form>
          </details>
          {node.user_id === userId ? (
            <div className="mt-2">
              <EditReply
                postId={postId}
                replyId={node.id}
                body={node.body}
                error={editReplyId === String(node.id) ? editError : undefined}
              />
              <DeleteReply postId={postId} replyId={node.id} />
            </div>
          ) : null}
        </div>
      </div>
      {node.children.length > 0 ? (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      ) : null}
    </div>
  );

  const roots = nestReplies(replies);
  return (
    <div className="mt-6 border-t border-line">
      {roots.length === 0 ? (
        <p className="py-6 text-sm text-mute">No replies yet.</p>
      ) : (
        roots.map((node) => <div key={node.id} className="border-b border-line py-4">{renderNode(node, 0)}</div>)
      )}
    </div>
  );
}
