"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
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
        const next = {
          score: previous.score + (previous.voted ? -1 : 1),
          voted: !previous.voted,
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
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="returnPath" value={pathname} />
      <VoteSubmit score={voteState.score} voted={voteState.voted} />
      {error ? (
        <span role="alert" className="block text-center text-xs text-clay">
          Could not save your vote. Try again.
        </span>
      ) : null}
    </form>
  );
}

function VoteSubmit({ score, voted }: { score: number; voted: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-pressed={voted}
      aria-label={voted ? "Remove upvote" : "Upvote"}
      className={`flex w-10 flex-col items-center gap-0.5 rounded-md py-1 text-xs disabled:cursor-wait ${
        voted ? "text-clay" : "text-mute hover:text-ink"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M7 2 L12 10 H2 Z" fill="currentColor" />
      </svg>
      <span className="tabular-nums">{score}</span>
    </button>
  );
}
