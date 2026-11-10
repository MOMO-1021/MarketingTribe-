"use client";

import { removeComment } from "@/lib/actions";

export function DeleteReply({ postId, replyId }: { postId: number; replyId: number }) {
  return (
    <form
      action={removeComment}
      onSubmit={(event) => {
        if (!window.confirm("Remove this reply?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="replyId" value={replyId} />
      <button type="submit" className="text-xs text-mute hover:text-clay">
        Remove
      </button>
    </form>
  );
}
