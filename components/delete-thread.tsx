"use client";

import { removeThread } from "@/lib/actions";

export function DeleteThread({ postId }: { postId: number }) {
  return (
    <form
      action={removeThread}
      onSubmit={(event) => {
        if (!window.confirm("Remove this thread and its replies?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <button type="submit" className="text-xs text-mute hover:text-clay">
        Remove thread
      </button>
    </form>
  );
}
