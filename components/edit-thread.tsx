"use client";

import { useState } from "react";
import { editThread } from "@/lib/actions";
import { FormError } from "./form-error";

export function EditThread({
  postId,
  title,
  body,
  error,
}: {
  postId: number;
  title: string;
  body: string;
  error?: string;
}) {
  const [editing, setEditing] = useState(Boolean(error));

  return (
    <div className="mt-4">
      {!editing ? (
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-mute hover:text-ink">
          Edit thread
        </button>
      ) : (
        <form action={editThread} className="space-y-3">
          <FormError message={error} />
          <input type="hidden" name="postId" value={postId} />
          <label className="block">
            <span className="label">Title</span>
            <input
              name="title"
              required
              minLength={8}
              maxLength={160}
              defaultValue={title}
              className="field"
            />
          </label>
          <label className="block">
            <span className="label">Details</span>
            <textarea name="body" rows={8} maxLength={8000} defaultValue={body} className="field resize-y" />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn">
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-mute hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
