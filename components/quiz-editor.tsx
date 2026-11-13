"use client";

import { useState } from "react";
import {
  createAdminQuiz,
  updateAdminQuiz,
} from "@/lib/admin-actions";
import type { AdminQuiz } from "@/lib/db";
import { SubmitButton } from "./submit-button";

type QuestionDraft = {
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
  sourceTitle: string;
  sourceUrl: string;
};

function blankQuestion(): QuestionDraft {
  return {
    prompt: "",
    options: ["", "", "", ""],
    correctOption: 0,
    explanation: "",
    sourceTitle: "",
    sourceUrl: "",
  };
}

export function QuizEditor({
  quiz,
  hasError,
  wasLocked,
}: {
  quiz: AdminQuiz | null;
  hasError: boolean;
  wasLocked: boolean;
}) {
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    quiz?.questions.map(({ prompt, options, correctOption, explanation, sourceTitle, sourceUrl }) => ({
      prompt,
      options,
      correctOption,
      explanation,
      sourceTitle,
      sourceUrl,
    })) ?? [blankQuestion()],
  );
  const questionContentLocked = (quiz?.submission_count ?? 0) > 0;
  const action = quiz ? updateAdminQuiz : createAdminQuiz;

  function updateQuestion(index: number, update: Partial<QuestionDraft>) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...update } : question,
      ),
    );
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    const options = [...questions[questionIndex].options];
    options[optionIndex] = value;
    updateQuestion(questionIndex, { options });
  }

  return (
    <form action={action} className="mt-6 space-y-8">
      {hasError ? (
        <p role="alert" className="rounded-lg border border-clay/40 bg-white p-3 text-sm text-clay">
          Complete the title, learning objective, and every question, answer, explanation, and source.
        </p>
      ) : null}
      {wasLocked ? (
        <p role="status" className="rounded-lg border border-line bg-white p-3 text-sm text-mute">
          The quiz has submissions, so only its title and learning objective were updated.
        </p>
      ) : null}
      {quiz ? <input type="hidden" name="quizId" value={quiz.id} /> : null}
      <input type="hidden" name="questions" value={JSON.stringify(questions)} readOnly />

      <section className="space-y-4 border-b border-line pb-6">
        <label className="block">
          <span className="label">Quiz title</span>
          <input
            name="title"
            defaultValue={quiz?.title}
            required
            minLength={3}
            maxLength={120}
            className="field"
          />
        </label>
        <label className="block">
          <span className="label">Learning objective</span>
          <textarea
            name="learningObjective"
            defaultValue={quiz?.learning_objective}
            required
            minLength={10}
            maxLength={500}
            rows={3}
            className="field resize-y"
            placeholder="By the end of this quiz, members will be able to…"
          />
        </label>
        <p className="text-xs leading-relaxed text-mute">
          Quizzes stay available to members until an admin deletes them.
        </p>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="font-serif text-2xl">Questions</h2>
          <p className="mt-1 text-sm text-mute">
            Add single-answer questions with a verified answer, explanation, and source for each.
          </p>
          {questionContentLocked ? (
            <p className="mt-3 rounded-lg border border-line bg-white p-3 text-sm text-mute">
              This quiz has submissions. Question wording, options, answer keys, explanations, and
              sources are locked to preserve past scores. The title and objective remain editable.
            </p>
          ) : null}
        </div>
        {questions.map((question, index) => (
          <fieldset
            key={index}
            disabled={questionContentLocked}
            className="space-y-4 border-t border-line pt-5 disabled:opacity-75"
          >
            <legend className="font-medium">Question {index + 1}</legend>
            {questions.length > 1 ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-mute underline underline-offset-4 hover:text-ink"
                  onClick={() =>
                    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))
                  }
                >
                  Remove
                </button>
              </div>
            ) : null}
            <label className="block">
              <span className="label">Question</span>
              <textarea
                required
                minLength={8}
                maxLength={500}
                rows={3}
                value={question.prompt}
                onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                className="field resize-y"
              />
            </label>
            <div className="space-y-3">
              <p className="label">Answer options · select the correct answer</p>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-mute">
                    Option {optionIndex + 1}
                  </span>
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    value={optionIndex}
                    checked={question.correctOption === optionIndex}
                    onChange={() => updateQuestion(index, { correctOption: optionIndex })}
                    aria-label={`Mark option ${optionIndex + 1} as correct`}
                    className="size-4 accent-ink"
                  />
                  <input
                    required
                    minLength={1}
                    maxLength={160}
                    value={option}
                    onChange={(event) => updateOption(index, optionIndex, event.target.value)}
                    aria-label={`Question ${index + 1}, option ${optionIndex + 1}`}
                    className="field"
                  />
                </div>
              ))}
            </div>
            <label className="block">
              <span className="label">Answer explanation</span>
              <textarea
                required
                minLength={5}
                maxLength={2000}
                rows={3}
                value={question.explanation}
                onChange={(event) => updateQuestion(index, { explanation: event.target.value })}
                className="field resize-y"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Source title</span>
                <input
                  required
                  minLength={2}
                  maxLength={200}
                  value={question.sourceTitle}
                  onChange={(event) => updateQuestion(index, { sourceTitle: event.target.value })}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="label">Source link</span>
                <input
                  required
                  type="url"
                  maxLength={1000}
                  value={question.sourceUrl}
                  onChange={(event) => updateQuestion(index, { sourceUrl: event.target.value })}
                  placeholder="https://…"
                  className="field"
                />
              </label>
            </div>
          </fieldset>
        ))}
        <button
          type="button"
          disabled={questions.length >= 20 || questionContentLocked}
          className="text-sm underline decoration-line underline-offset-4 disabled:opacity-50"
          onClick={() => setQuestions((current) => [...current, blankQuestion()])}
        >
          Add question
        </button>
      </section>

      <SubmitButton className="btn-large" pendingLabel={quiz ? "Saving changes…" : "Creating quiz…"}>
        {quiz ? "Save changes" : "Create quiz"}
      </SubmitButton>
    </form>
  );
}
