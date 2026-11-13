import Link from "next/link";
import type { MemberQuizSummary } from "@/lib/db";

export function HomeQuizCard({ quiz }: { quiz: MemberQuizSummary | null }) {
  const href = quiz ? `/quizzes/${quiz.id}` : "/quizzes";
  const label = !quiz
    ? "Weekly learning"
    : quiz.has_submitted
      ? "Quiz completed"
      : "Available anytime";
  const action = !quiz
    ? "Browse quizzes"
    : quiz.has_submitted
      ? "Review your answers"
      : "Take this quiz";

  return (
    <section aria-label="Weekly quiz" className="mb-6">
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-clay/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-clay sm:p-6"
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-clay" />
        <div className="flex items-start justify-between gap-4 pl-2">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-paper px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-clay">
              {label}
            </span>
            <h2 className="mt-3 font-serif text-2xl tracking-tight text-ink">
              {quiz ? quiz.title : "Your next MarketingTribe quiz"}
            </h2>
            <p className="mt-3 text-xs uppercase tracking-[0.12em] text-mute">
              Learning objective
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink">
              {quiz
                ? quiz.learning_objective
                : "Objective-led, source-backed marketing quizzes live here. Check back when the next one is added."}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="mt-1 hidden size-10 shrink-0 items-center justify-center rounded-full bg-paper text-lg text-clay transition group-hover:translate-x-1 sm:flex"
          >
            →
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 pl-2">
          <p className="text-xs text-mute">
            {quiz
              ? quiz.has_submitted
                ? `Your score: ${quiz.score}/${quiz.question_count}`
                : `${quiz.question_count} questions · Available whenever you're ready`
              : "A short, source-backed way to keep learning together"}
          </p>
          <span className="text-sm font-medium text-clay group-hover:underline group-hover:underline-offset-4">
            {action} <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </section>
  );
}
