import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { listQuizzesForMember } from "@/lib/db";

export const metadata: Metadata = { title: "Weekly quizzes" };

export default async function QuizzesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const quizzes = await listQuizzesForMember(user.id);
  const now = Date.now();

  return (
    <div>
      <header className="border-b border-line pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-mute">Learn together</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">Weekly quizzes</h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          Each quiz has a learning objective and source-based explanations.
        </p>
      </header>

      {quizzes.length === 0 ? (
        <p className="mt-6 border-t border-line py-8 text-sm text-mute">
          No quizzes are scheduled yet. Check back soon.
        </p>
      ) : (
        <ul className="divide-y divide-line border-b border-line">
          {quizzes.map((quiz) => {
            const isUpcoming = now < quiz.opens_at;
            const isOpen = now >= quiz.opens_at && now < quiz.closes_at;
            const status = quiz.has_submitted
              ? `Completed · ${quiz.score}/${quiz.question_count}`
              : isOpen
                ? "Open now"
                : isUpcoming
                  ? "Upcoming"
                  : "Closed";
            return (
              <li key={quiz.id} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-serif text-xl">
                    <Link href={`/quizzes/${quiz.id}`} className="hover:underline">
                      {quiz.title}
                    </Link>
                  </h2>
                  <span className="text-xs uppercase tracking-wide text-mute">{status}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{quiz.learning_objective}</p>
                <p className="mt-2 text-xs text-mute">
                  {formatDateTime(quiz.opens_at)} – {formatDateTime(quiz.closes_at)}
                  {" · "}{quiz.question_count} questions
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
