"use client";

import { useEffect, useRef, useState } from "react";

type VoteTarget =
  | { postId: number; replyId?: never }
  | { replyId: number; postId?: never };

type VoteState = {
  score: number;
  voted: -1 | 0 | 1;
};

export function VoteButton({
  postId,
  replyId,
  score,
  voted,
}: VoteTarget & VoteState) {
  const [voteState, setVoteState] = useState({ score, voted });
  const [error, setError] = useState(false);
  const stateRef = useRef(voteState);
  const committedStateRef = useRef(voteState);
  const pendingCountRef = useRef(0);
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    if (pendingCountRef.current === 0) {
      const current = { score, voted };
      stateRef.current = current;
      committedStateRef.current = current;
      setVoteState(current);
    }
  }, [score, voted]);

  function handleVote(direction: -1 | 1) {
    const previous = stateRef.current;
    const nextVoted: VoteState["voted"] = previous.voted === direction ? 0 : direction;
    const optimistic = {
      score: Math.max(0, previous.score - previous.voted + nextVoted),
      voted: nextVoted,
    };

    stateRef.current = optimistic;
    setVoteState(optimistic);
    setError(false);
    pendingCountRef.current += 1;

    const operation = queueRef.current
      .then(async () => {
        const response = await fetch("/api/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId,
            replyId,
            voteValue: nextVoted,
          }),
        });
        if (!response.ok) throw new Error("Vote request failed");

        const result: unknown = await response.json();
        if (
          !result ||
          typeof result !== "object" ||
          !("score" in result) ||
          !("voted" in result) ||
          typeof result.score !== "number" ||
          !Number.isFinite(result.score) ||
          (result.voted !== -1 && result.voted !== 0 && result.voted !== 1)
        ) {
          throw new Error("Invalid vote response");
        }
        const saved: VoteState = { score: result.score, voted: result.voted };

        committedStateRef.current = saved;
        if (pendingCountRef.current === 1) {
          stateRef.current = saved;
          setVoteState(saved);
        }
      })
      .catch(() => {
        setError(true);
        if (pendingCountRef.current === 1) {
          stateRef.current = committedStateRef.current;
          setVoteState(committedStateRef.current);
        }
      })
      .finally(() => {
        pendingCountRef.current -= 1;
      });

    queueRef.current = operation;
  }

  return (
    <div>
      <div className="flex w-10 flex-col items-center">
        <VoteSubmit direction={1} voted={voteState.voted} onVote={handleVote} />
        <span className="py-0.5 text-xs tabular-nums">{voteState.score}</span>
        <VoteSubmit direction={-1} voted={voteState.voted} onVote={handleVote} />
      </div>
      {error ? (
        <span role="alert" className="block text-center text-xs text-clay">
          Could not save your vote. Try again.
        </span>
      ) : null}
    </div>
  );
}

function VoteSubmit({
  direction,
  voted,
  onVote,
}: {
  direction: -1 | 1;
  voted: -1 | 0 | 1;
  onVote: (direction: -1 | 1) => void;
}) {
  const selected = voted === direction;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${selected ? "Remove " : ""}${direction === 1 ? "upvote" : "downvote"}`}
      className={`rounded-md px-2 py-1 text-xs ${
        selected ? "text-clay" : "text-mute hover:text-ink"
      }`}
      onClick={() => onVote(direction)}
    >
      {direction === 1 ? "▲" : "▼"}
    </button>
  );
}
