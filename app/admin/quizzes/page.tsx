import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminLogout } from "@/lib/admin-actions";
import { hasAdminSession } from "@/lib/admin-session";
import { formatDateTime } from "@/lib/format";
import { listQuizzesForAdmin } from "@/lib/db";

export const metadata: Metadata = { title: "Manage quizzes" };
export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const [{ created }, quizzes] = await Promise.all([searchParams, listQuizzesForAdmin()]);
  const now = Date.now();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <Link href="/admin" className="text-sm text-mute underline underline-offset-4">
            Admin dashboard
          </Link>
          <h1 className="mt-3 font-serif text-3xl tracking-tight">Weekly quizzes</h1>
          <p className="mt-2 text-sm text-mute">Create and schedule source-reviewed quizzes.</p>
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

      {created === "1" ? (
        <p role="status" className="mt-5 rounded-lg border border-line bg-white p-3 text-sm">
          Quiz scheduled successfully.
        </p>
      ) : null}

      {quizzes.length === 0 ? (
        <p className="mt-8 border-t border-line py-8 text-sm text-mute">
          No quizzes yet. Create one after reviewing its questions, answers, and sources.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {quizzes.map((quiz) => {
            const status =
              now < quiz.opens_at ? "Upcoming" : now < quiz.closes_at ? "Open" : "Closed";
            return (
              <li key={quiz.id} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-serif text-xl">{quiz.title}</h2>
                  <span className="text-xs uppercase tracking-wide text-mute">{status}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{quiz.learning_objective}</p>
                <p className="mt-2 text-xs leading-relaxed text-mute">
                  {formatDateTime(quiz.opens_at)} – {formatDateTime(quiz.closes_at)}
                  {" · "}{quiz.question_count} questions
                  {" · "}{quiz.submission_count} submissions
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
