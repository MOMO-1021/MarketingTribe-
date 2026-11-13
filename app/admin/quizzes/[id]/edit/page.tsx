import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuizEditor } from "@/components/quiz-editor";
import { hasAdminSession } from "@/lib/admin-session";
import { getQuizForAdmin } from "@/lib/db";

export const metadata: Metadata = { title: "Edit quiz" };
export const dynamic = "force-dynamic";

export default async function EditQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string; updated?: string }>;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const [{ id: rawId }, { e, updated }] = await Promise.all([params, searchParams]);
  const quizId = Number(rawId);
  if (!Number.isSafeInteger(quizId) || quizId <= 0) notFound();

  const quiz = await getQuizForAdmin(quizId);
  if (!quiz) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/admin/quizzes" className="text-sm text-mute underline underline-offset-4">
        Back to quizzes
      </Link>
      <h1 className="mt-3 font-serif text-3xl tracking-tight">Edit quiz</h1>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        This quiz remains available to members until you delete it.
      </p>
      <QuizEditor
        quiz={quiz}
        hasError={e === "invalid"}
        wasLocked={updated === "locked"}
      />
    </main>
  );
}
