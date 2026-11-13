"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createQuiz, type QuizQuestionInput } from "./db";
import {
  checkAdminCredentials,
  clearAdminSession,
  hasAdminSession,
  setAdminSession,
} from "./admin-session";

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function localDateTimeToTimestamp(value: string, offsetMinutes: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  if (month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59) return null;
  const timestamp = Date.UTC(year, month - 1, day, hour, minute) + offsetMinutes * 60_000;
  const date = new Date(timestamp - offsetMinutes * 60_000);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return timestamp;
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
  const timezoneOffset = formData.get("timezoneOffset");
  const offsetValue =
    typeof timezoneOffset === "string" && /^-?\d+$/.test(timezoneOffset)
      ? Number(timezoneOffset)
      : Number.NaN;
  const opensAtValue = formData.get("opensAt");
  const closesAtValue = formData.get("closesAt");
  const opensAt =
    typeof opensAtValue === "string" &&
    Number.isInteger(offsetValue) &&
    offsetValue >= -840 &&
    offsetValue <= 840
      ? localDateTimeToTimestamp(opensAtValue, offsetValue)
      : null;
  const closesAt =
    typeof closesAtValue === "string" &&
    Number.isInteger(offsetValue) &&
    offsetValue >= -840 &&
    offsetValue <= 840
      ? localDateTimeToTimestamp(closesAtValue, offsetValue)
      : null;
  const questions = parseQuizQuestions(formData.get("questions"));
  if (
    title.length < 3 ||
    learningObjective.length < 10 ||
    opensAt === null ||
    closesAt === null ||
    closesAt <= opensAt ||
    !questions
  ) {
    redirect("/admin/quizzes/new?e=invalid");
  }

  await createQuiz({
    title,
    learningObjective,
    opensAt,
    closesAt,
    createdAt: Date.now(),
    questions,
  });
  revalidatePath("/admin/quizzes");
  revalidatePath("/quizzes");
  redirect("/admin/quizzes?created=1");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}
