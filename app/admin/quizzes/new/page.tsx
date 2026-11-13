import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QuizEditor } from "@/components/quiz-editor";
import { hasAdminSession } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Create a quiz" };

export default async function NewQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const { e } = await searchParams;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/admin/quizzes" className="text-sm text-mute underline underline-offset-4">
        Back to quizzes
      </Link>
      <h1 className="mt-3 font-serif text-3xl tracking-tight">Schedule a quiz</h1>
      <p className="mt-2 text-sm leading-relaxed text-mute">
        Enter questions only after reviewing their accuracy. Each question needs a verified answer,
        explanation, and source link.
      </p>
      <QuizEditor hasError={e === "invalid"} />
    </main>
  );
}
