"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getQuizQuestionsForScoring, saveQuizSubmission } from "./db";
import { getCurrentUser } from "./session";

export async function submitQuiz(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.welcome_read_at === null) redirect("/welcome");

  const quizId = Number(formData.get("quizId"));
  if (!Number.isSafeInteger(quizId) || quizId <= 0) redirect("/quizzes");
  const questions = await getQuizQuestionsForScoring(quizId);
  if (questions.length === 0) redirect(`/quizzes/${quizId}`);

  const answers: Record<string, number> = {};
  for (const question of questions) {
    const raw = formData.get(`answer_${question.id}`);
    if (typeof raw !== "string" || !/^[0-3]$/.test(raw)) {
      redirect(`/quizzes/${quizId}?e=incomplete`);
    }
    answers[String(question.id)] = Number(raw);
  }

  const saved = await saveQuizSubmission(quizId, user.id, answers, Date.now());
  if (!saved) redirect(`/quizzes/${quizId}?e=retry`);
  revalidatePath("/quizzes");
  revalidatePath(`/quizzes/${quizId}`);
  redirect(`/quizzes/${quizId}`);
}
