import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { getQuizForMember } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { submitQuiz } from "@/lib/quiz-actions";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { id: rawId } = await params;
  const quizId = Number(rawId);
  if (!Number.isSafeInteger(quizId) || quizId <= 0) notFound();

  const user = await getCurrentUser();
  if (!user) return null;
  const [quiz, { e }] = await Promise.all([
    getQuizForMember(quizId, user.id),
    searchParams,
  ]);
  if (!quiz) notFound();

  const now = Date.now();
  const isUpcoming = now < quiz.opens_at;
  const isClosed = now >= quiz.closes_at;
  const isSubmitted = quiz.submitted_at !== null;

  return (
    <article>
      <Link href="/quizzes" className="text-sm text-mute underline underline-offset-4">
        All quizzes
      </Link>
      <header className="mt-4 border-b border-line pb-5">
        <p className="text-xs uppercase tracking-[0.14em] text-mute">
          {isSubmitted ? "Quiz results" : isUpcoming ? "Upcoming quiz" : isClosed ? "Quiz closed" : "Weekly quiz"}
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">{quiz.title}</h1>
        <p className="mt-4 text-xs uppercase tracking-wide text-mute">Learning objective</p>
        <p className="mt-1 text-sm leading-relaxed">{quiz.learning_objective}</p>
        <p className="mt-3 text-xs text-mute">
          {formatDateTime(quiz.opens_at)} – {formatDateTime(quiz.closes_at)}
        </p>
      </header>

      {isSubmitted ? (
        <section className="mt-6">
          <p className="rounded-lg border border-line bg-white p-4 font-medium">
            Your score: {quiz.score} / {quiz.questions.length}
          </p>
          <ol className="mt-6 space-y-6">
            {quiz.questions.map((question, index) => (
              <li key={question.id} className="border-t border-line pt-5">
                <p className="text-xs uppercase tracking-wide text-mute">Question {index + 1}</p>
                <h2 className="mt-2 font-medium leading-relaxed">{question.prompt}</h2>
                <div className="mt-3 space-y-2 text-sm">
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === question.correct_option;
                    const wasSelected = optionIndex === question.selected_option;
                    return (
                      <p
                        key={optionIndex}
                        className={isCorrect ? "font-medium text-emerald-800" : wasSelected ? "text-clay" : "text-mute"}
                      >
                        {isCorrect ? "Correct answer: " : wasSelected ? "Your answer: " : ""}
                        {option}
                      </p>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm leading-relaxed">{question.explanation}</p>
                <p className="mt-3 text-xs text-mute">
                  Source:{" "}
                  <a
                    href={question.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    {question.source_title}
                  </a>
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : isUpcoming ? (
        <p className="mt-6 text-sm text-mute">This quiz will be available when it opens.</p>
      ) : isClosed ? (
        <p className="mt-6 text-sm text-mute">
          This quiz has closed. Answers and explanations are available to members who submitted it.
        </p>
      ) : (
        <form action={submitQuiz} className="mt-6">
          <input type="hidden" name="quizId" value={quiz.id} />
          {e === "incomplete" ? (
            <p role="alert" className="mb-4 text-sm text-clay">
              Choose one answer for every question before submitting.
            </p>
          ) : null}
          <ol className="space-y-7">
            {quiz.questions.map((question, index) => (
              <li key={question.id} className="border-t border-line pt-5">
                <fieldset>
                  <legend className="font-medium leading-relaxed">
                    <span className="mr-2 text-xs uppercase tracking-wide text-mute">
                      {index + 1}.
                    </span>
                    {question.prompt}
                  </legend>
                  <div className="mt-4 space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex cursor-pointer items-start gap-3 text-sm">
                        <input
                          type="radio"
                          name={`answer_${question.id}`}
                          value={optionIndex}
                          required
                          className="mt-0.5 size-4 accent-ink"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-mute">
            You can submit this quiz once. Your answers cannot be changed after submission.
          </p>
          <SubmitButton className="btn-large mt-4" pendingLabel="Submitting…">
            Submit quiz
          </SubmitButton>
        </form>
      )}
    </article>
  );
}
