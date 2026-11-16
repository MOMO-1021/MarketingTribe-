import Link from "next/link";
import type { QuizLeaderboardEntry, QuizLeaderboardOption } from "@/lib/db";

export function HomeQuizLeaderboard({
  options,
  selectedQuiz,
  entries,
  sort,
  scoreOrder,
}: {
  options: QuizLeaderboardOption[];
  selectedQuiz: QuizLeaderboardOption | null;
  entries: QuizLeaderboardEntry[];
  sort: "new" | "top";
  scoreOrder: "asc" | "desc";
}) {
  const nextScoreOrder = scoreOrder === "asc" ? "desc" : "asc";
  const scoreOrderHref = selectedQuiz
    ? `/home?${new URLSearchParams({
        ...(sort === "top" ? { sort: "top" } : {}),
        leaderboard: String(selectedQuiz.id),
        scoreOrder: nextScoreOrder,
      }).toString()}`
    : "/home";

  return (
    <section
      aria-labelledby="quiz-leaderboard-title"
      className="mb-7 rounded-2xl border border-line bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-clay">Community scores</p>
          <h2 id="quiz-leaderboard-title" className="mt-1 font-serif text-2xl tracking-tight">
            Quiz leaderboard
          </h2>
        </div>
        {selectedQuiz ? (
          <Link
            href={scoreOrderHref}
            className="rounded-full bg-paper px-3 py-1 text-xs text-mute hover:text-ink"
            aria-label={`Change score order to ${nextScoreOrder === "asc" ? "lowest to highest" : "highest to lowest"}`}
          >
            {scoreOrder === "asc" ? "Lowest to highest" : "Highest to lowest"}
          </Link>
        ) : null}
      </div>

      {options.length === 0 ? (
        <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-mute">
          No scores yet. Take a quiz to start the leaderboard.
        </p>
      ) : (
        <>
          <form action="/home" method="get" className="mt-4 flex flex-wrap items-end gap-3">
            {sort === "top" ? <input type="hidden" name="sort" value="top" /> : null}
            {scoreOrder === "desc" ? (
              <input type="hidden" name="scoreOrder" value="desc" />
            ) : null}
            <label className="min-w-0 flex-1">
              <span className="label">Quiz</span>
              <select
                name="leaderboard"
                defaultValue={selectedQuiz?.id}
                className="field"
              >
                {options.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn">
              View scores
            </button>
          </form>

          {selectedQuiz ? (
            <div className="mt-5 border-t border-line pt-2">
              <p className="py-2 text-sm font-medium">{selectedQuiz.title}</p>
              {entries.length === 0 ? (
                <p className="py-3 text-sm text-mute">No submissions for this quiz yet.</p>
              ) : (
                <ol
                  aria-label={`${selectedQuiz.title} scores, ${scoreOrder === "asc" ? "lowest to highest" : "highest to lowest"}`}
                  className="divide-y divide-line"
                >
                  {entries.map((entry, index) => (
                    <li
                      key={`${entry.profile_id ?? entry.member_name}-${index}`}
                      className="flex items-center justify-between gap-4 py-2.5 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="w-6 shrink-0 text-right text-xs tabular-nums text-mute">
                          {index + 1}
                        </span>
                        {entry.profile_id ? (
                          <Link
                            href={`/u/${entry.profile_id}`}
                            className="truncate hover:underline"
                          >
                            {entry.member_name}
                          </Link>
                        ) : (
                          <span className="truncate text-mute">{entry.member_name}</span>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {entry.score}/{entry.question_count}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
