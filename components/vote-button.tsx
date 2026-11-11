"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { vote } from "@/lib/actions";

type VoteTarget =
  | { postId: number; replyId?: never }
  | { replyId: number; postId?: never };

export function VoteButton({
  postId,
  replyId,
  score,
  voted,
}: VoteTarget & {
  score: number;
  voted: -1 | 0 | 1;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [voteState, setVoteState] = useState({ score, voted });
  const [error, setError] = useState(false);

  useEffect(() => {
    setVoteState({ score, voted });
  }, [score, voted]);

  return (
    <form
      action={async (formData) => {
        const previous = voteState;
        const direction = Number(formData.get("direction"));
        if (direction !== -1 && direction !== 1) {
          setError(true);
          return;
        }
        const nextVoted: -1 | 0 | 1 = previous.voted === direction ? 0 : direction;
        const next = {
          score: previous.score - previous.voted + nextVoted,
          voted: nextVoted,
        };
        setVoteState(next);
        setError(false);
        try {
          const saved = await vote(formData);
          if (saved !== "saved") {
            setVoteState(previous);
            router.push(saved === "welcome" ? "/welcome" : "/login");
          }
        } catch {
          setVoteState(previous);
          setError(true);
        }
      }}
    >
      {postId !== undefined ? <input type="hidden" name="postId" value={postId} /> : null}
      {replyId !== undefined ? <input type="hidden" name="replyId" value={replyId} /> : null}
      <input type="hidden" name="returnPath" value={pathname} />
      <div className="flex w-10 flex-col items-center">
        <VoteSubmit direction={1} voted={voteState.voted} />
        <span className="py-0.5 text-xs tabular-nums">{voteState.score}</span>
        <VoteSubmit direction={-1} voted={voteState.voted} />
      </div>
      {error ? (
        <span role="alert" className="block text-center text-xs text-clay">
          Could not save your vote. Try again.
        </span>
      ) : null}
    </form>
  );
}

function VoteSubmit({ direction, voted }: { direction: -1 | 1; voted: -1 | 0 | 1 }) {
  const { pending } = useFormStatus();
  const selected = voted === direction;

  return (
    <button
      type="submit"
      name="direction"
      value={direction}
      disabled={pending}
      aria-busy={pending}
      aria-pressed={selected}
      aria-label={`${selected ? "Remove " : ""}${direction === 1 ? "upvote" : "downvote"}`}
      className={`rounded-md px-2 py-1 text-xs disabled:cursor-wait ${
        selected ? "text-clay" : "text-mute hover:text-ink"
      }`}
    >
      {direction === 1 ? "▲" : "▼"}
    </button>
  );
}
