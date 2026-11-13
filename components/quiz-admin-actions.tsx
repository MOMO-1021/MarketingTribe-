"use client";

import { deleteAdminQuiz } from "@/lib/admin-actions";

export function QuizDeleteForm({ quizId, title }: { quizId: number; title: string }) {
  return (
    <form
      action={deleteAdminQuiz}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete "${title}" permanently? All questions, submissions, and leaderboard scores will also be deleted.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="quizId" value={quizId} />
      <label className="flex items-center gap-1.5 text-xs text-mute">
        <input type="checkbox" name="confirmDelete" value="yes" required />
        Confirm
      </label>
      <button
        type="submit"
        className="text-sm text-clay underline decoration-clay/40 underline-offset-4 hover:decoration-clay"
      >
        Delete
      </button>
    </form>
  );
}
