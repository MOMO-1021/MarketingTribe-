"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createQuiz,
  deleteQuiz,
  updateQuiz,
  type QuizQuestionInput,
} from "./db";
import {
  checkAdminCredentials,
  clearAdminSession,
  hasAdminSession,
  setAdminSession,
} from "./admin-session";

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseQuizQuestions(value: FormDataEntryValue | null): QuizQuestionInput[] | null {
  if (typeof value !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 20) return null;

  const questions: QuizQuestionInput[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const record = item as Record<string, unknown>;
    const prompt = text(record.prompt, 500);
    const options = Array.isArray(record.options)
      ? record.options.map((option) => text(option, 160))
      : [];
    const correctOption = record.correctOption;
    const explanation = text(record.explanation, 2000);
    const sourceTitle = text(record.sourceTitle, 200);
    const sourceUrl = text(record.sourceUrl, 1000);
    if (
      prompt.length < 8 ||
      options.length !== 4 ||
      options.some((option) => option.length === 0) ||
      new Set(options.map((option) => option.toLowerCase())).size !== 4 ||
      typeof correctOption !== "number" ||
      !Number.isInteger(correctOption) ||
      correctOption < 0 ||
      correctOption > 3 ||
      explanation.length < 5 ||
      sourceTitle.length < 2 ||
      sourceUrl.length === 0
    ) {
      return null;
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return null;
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") return null;
    questions.push({
      prompt,
      options,
      correctOption,
      explanation,
      sourceTitle,
      sourceUrl: parsedUrl.toString(),
    });
  }
  return questions;
}

export async function adminLogin(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const password = String(formData.get("password") ?? "");
  if (code.length > 256 || password.length > 256) {
    redirect("/admin/login?e=credentials");
  }
  if (!checkAdminCredentials(code, password)) {
    redirect("/admin/login?e=credentials");
  }
  await setAdminSession();
  redirect("/admin");
}

export async function createAdminQuiz(formData: FormData) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  const title = text(formData.get("title"), 120);
  const learningObjective = text(formData.get("learningObjective"), 500);
  const questions = parseQuizQuestions(formData.get("questions"));
  if (
    title.length < 3 ||
    learningObjective.length < 10 ||
    !questions
  ) {
    redirect("/admin/quizzes/new?e=invalid");
  }

  await createQuiz({
    title,
    learningObjective,
    createdAt: Date.now(),
    questions,
  });
  revalidatePath("/admin/quizzes");
  revalidatePath("/quizzes");
  revalidatePath("/home");
  redirect("/admin/quizzes?created=1");
}

export async function updateAdminQuiz(formData: FormData) {
  if (!(await hasAdminSession())) redirect("/admin/login");

  const quizId = Number(formData.get("quizId"));
  const title = text(formData.get("title"), 120);
  const learningObjective = text(formData.get("learningObjective"), 500);
  if (!Number.isSafeInteger(quizId) || quizId <= 0) redirect("/admin/quizzes");
  const questions = parseQuizQuestions(formData.get("questions"));
  if (
    title.length < 3 ||
    learningObjective.length < 10 ||
    !questions
  ) {
    redirect(`/admin/quizzes/${quizId}/edit?e=invalid`);
  }

  const result = await updateQuiz({
    id: quizId,
    title,
    learningObjective,
    questions,
  });
  if (!result) redirect("/admin/quizzes");

  revalidatePath("/admin/quizzes");
  revalidatePath(`/admin/quizzes/${quizId}/edit`);
  revalidatePath("/quizzes");
  revalidatePath(`/quizzes/${quizId}`);
  revalidatePath("/home");
  redirect(
    result === "questions-locked"
      ? `/admin/quizzes/${quizId}/edit?updated=locked`
      : "/admin/quizzes?updated=1",
  );
}

export async function deleteAdminQuiz(formData: FormData) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const quizId = Number(formData.get("quizId"));
  if (!Number.isSafeInteger(quizId) || quizId <= 0) redirect("/admin/quizzes");
  if (formData.get("confirmDelete") !== "yes") redirect("/admin/quizzes?e=confirm");

  if (!(await deleteQuiz(quizId))) redirect("/admin/quizzes?e=missing");
  revalidatePath("/admin/quizzes");
  revalidatePath("/quizzes");
  revalidatePath(`/quizzes/${quizId}`);
  revalidatePath("/home");
  redirect("/admin/quizzes?deleted=1");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}
