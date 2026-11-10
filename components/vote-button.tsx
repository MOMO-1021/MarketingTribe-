import { vote } from "@/lib/actions";

export function VoteButton({
  postId,
  score,
  voted,
}: {
  postId: number;
  score: number;
  voted: boolean;
}) {
  return (
    <form action={vote}>
      <input type="hidden" name="postId" value={postId} />
      <button
        type="submit"
        aria-pressed={voted}
        aria-label={voted ? "Remove upvote" : "Upvote"}
        className={`flex w-10 flex-col items-center gap-0.5 rounded-md py-1 text-xs ${
          voted ? "text-clay" : "text-mute hover:text-ink"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M7 2 L12 10 H2 Z" fill="currentColor" />
        </svg>
        <span className="tabular-nums">{score}</span>
      </button>
    </form>
  );
}
