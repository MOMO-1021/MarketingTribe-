import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminLogout } from "@/lib/admin-actions";
import { hasAdminSession } from "@/lib/admin-session";
import { formatDate } from "@/lib/format";
import { listQuizzesForAdmin } from "@/lib/db";
import { QuizDeleteForm } from "@/components/quiz-admin-actions";

export const metadata: Metadata = { title: "Manage quizzes" };
export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; deleted?: string; updated?: string; e?: string }>;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const [{ created, deleted, updated, e }, quizzes] = await Promise.all([
    searchParams,
    listQuizzesForAdmin(),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <Link href="/admin" className="text-sm text-mute underline underline-offset-4">
            Admin dashboard
          </Link>
          <h1 className="mt-3 font-serif text-3xl tracking-tight">Weekly quizzes</h1>
          <p className="mt-2 text-sm text-mute">Create and manage source-reviewed quizzes.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/quizzes/new" className="btn">
            Create quiz
          </Link>
          <form action={adminLogout}>
            <button type="submit" className="text-sm text-mute hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {created === "1" || deleted === "1" || updated === "1" ? (
        <p role="status" className="mt-5 rounded-lg border border-line bg-white p-3 text-sm">
          {created === "1" ? "Quiz created." : deleted === "1" ? "Quiz and its scores deleted." : "Quiz updated."}
        </p>
      ) : null}
      {e === "confirm" || e === "missing" ? (
        <p role="alert" className="mt-5 rounded-lg border border-clay/40 bg-white p-3 text-sm text-clay">
          {e === "confirm" ? "Confirm deletion before removing a quiz." : "That quiz no longer exists."}
        </p>
      ) : null}

      {quizzes.length === 0 ? (
        <p className="mt-8 border-t border-line py-8 text-sm text-mute">
          No quizzes yet. Create one after reviewing its questions, answers, and sources.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {quizzes.map((quiz) => (
              <li key={quiz.id} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-serif text-xl">{quiz.title}</h2>
                  <span className="text-xs text-mute">
                    {quiz.submission_count} submissions
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{quiz.learning_objective}</p>
                <p className="mt-2 text-xs leading-relaxed text-mute">
                  Created {formatDate(quiz.created_at)}
                  {" · "}{quiz.question_count} questions
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <Link
                    href={`/admin/quizzes/${quiz.id}/edit`}
                    className="text-sm underline decoration-line underline-offset-4"
                  >
                    Edit quiz
                  </Link>
                  <QuizDeleteForm quizId={quiz.id} title={quiz.title} />
                </div>
              </li>
          ))}
        </ul>
      )}
    </main>
  );
}
