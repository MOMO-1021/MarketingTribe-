"use client";

import { removeThread } from "@/lib/actions";
import { SubmitButton } from "./submit-button";

export function DeleteThread({ postId }: { postId: number }) {
  return (
    <form
      action={removeThread}
      onSubmit={(event) => {
        if (!window.confirm("Remove this thread and its replies?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <SubmitButton
        className="text-xs text-mute hover:text-clay"
        pendingLabel="Removing…"
      >
        Remove thread
      </SubmitButton>
    </form>
  );
}
