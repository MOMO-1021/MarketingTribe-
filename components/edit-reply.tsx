"use client";

import { useState } from "react";
import { editReply } from "@/lib/actions";
import { FormError } from "./form-error";

export function EditReply({
  postId,
  replyId,
  body,
  error,
}: {
  postId: number;
  replyId: number;
  body: string;
  error?: string;
}) {
  const [editing, setEditing] = useState(Boolean(error));

  return (
    <div className="mt-2">
      {!editing ? (
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-mute hover:text-ink">
          Edit
        </button>
      ) : (
        <form action={editReply} className="space-y-3">
          <FormError message={error} />
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="replyId" value={replyId} />
          <textarea
            name="body"
            required
            rows={4}
            maxLength={4000}
            defaultValue={body}
            className="field resize-y"
          />
          <div className="flex items-center gap-3">
            <button type="submit" className="btn">
              Save changes
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-mute hover:text-ink">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
